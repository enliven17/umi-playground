module example::AdvancedVault {
    use std::signer;
    use std::vector;
    use std::option::{Self, Option};
    use std::timestamp;
    use std::hash;
    use std::string::{Self, String};

    // Error codes
    const ENOT_AUTHORIZED: u64 = 1;
    const EINSUFFICIENT_BALANCE: u64 = 2;
    const EINVALID_AMOUNT: u64 = 3;
    const EVAULT_NOT_INITIALIZED: u64 = 4;
    const EPROPOSAL_NOT_FOUND: u64 = 5;
    const EVOTING_PERIOD_ENDED: u64 = 6;
    const EALREADY_VOTED: u64 = 7;
    const EINSUFFICIENT_VOTING_POWER: u64 = 8;
    const EREWARD_NOT_READY: u64 = 9;

    // Constants
    const MINIMUM_STAKE: u64 = 1000000; // 1 token with 6 decimals
    const REWARD_RATE: u64 = 100; // 1% = 100 basis points
    const BASIS_POINTS: u64 = 10000;
    const VOTING_PERIOD: u64 = 259200; // 3 days in seconds
    const MINIMUM_QUORUM: u64 = 10000000; // 10 tokens minimum

    // Structs
    struct Vault has key, store {
        total_staked: u64,
        reward_per_token: u64,
        last_update_time: u64,
        reward_rate: u64,
        voting_period: u64,
        quorum: u64,
        proposal_count: u64,
        owner: address,
    }

    struct UserStake has key, store {
        amount: u64,
        reward_debt: u64,
        last_claim_time: u64,
        voting_power: u64,
    }

    struct Proposal has key, store {
        id: u64,
        description: String,
        for_votes: u64,
        against_votes: u64,
        start_time: u64,
        executed: bool,
        canceled: bool,
        creator: address,
    }

    struct Vote has key, store {
        has_voted: bool,
        support: bool,
        voting_power: u64,
    }

    struct Rewards has key, store {
        pending_rewards: u64,
        last_claim_time: u64,
    }

    // Events
    struct StakeEvent has drop, store {
        user: address,
        amount: u64,
        timestamp: u64,
    }

    struct WithdrawEvent has drop, store {
        user: address,
        amount: u64,
        timestamp: u64,
    }

    struct RewardClaimEvent has drop, store {
        user: address,
        amount: u64,
        timestamp: u64,
    }

    struct ProposalCreatedEvent has drop, store {
        proposal_id: u64,
        description: String,
        creator: address,
        timestamp: u64,
    }

    struct VoteEvent has drop, store {
        proposal_id: u64,
        voter: address,
        support: bool,
        voting_power: u64,
        timestamp: u64,
    }

    struct ProposalExecutedEvent has drop, store {
        proposal_id: u64,
        timestamp: u64,
    }

    // Initialize the vault
    public entry fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);
        
        // Initialize vault
        move_to(account, Vault {
            total_staked: 0,
            reward_per_token: 0,
            last_update_time: timestamp::now_seconds(),
            reward_rate: REWARD_RATE,
            voting_period: VOTING_PERIOD,
            quorum: MINIMUM_QUORUM,
            proposal_count: 0,
            owner: account_addr,
        });

        // Initialize user stake
        move_to(account, UserStake {
            amount: 0,
            reward_debt: 0,
            last_claim_time: timestamp::now_seconds(),
            voting_power: 0,
        });

        // Initialize rewards
        move_to(account, Rewards {
            pending_rewards: 0,
            last_claim_time: timestamp::now_seconds(),
        });
    }

    // Stake tokens
    public entry fun stake(account: &signer, amount: u64) acquires Vault, UserStake, Rewards {
        assert!(amount >= MINIMUM_STAKE, EINVALID_AMOUNT);
        
        let account_addr = signer::address_of(account);
        let vault = borrow_global_mut<Vault>(@example);
        let user_stake = borrow_global_mut<UserStake>(account_addr);
        let rewards = borrow_global_mut<Rewards>(account_addr);

        // Update rewards
        _update_reward(vault, user_stake, rewards);

        // Update staking
        user_stake.amount = user_stake.amount + amount;
        user_stake.voting_power = user_stake.amount;
        vault.total_staked = vault.total_staked + amount;

        // Emit event
        let stake_event = StakeEvent {
            user: account_addr,
            amount,
            timestamp: timestamp::now_seconds(),
        };
        event::emit(stake_event);
    }

    // Withdraw staked tokens
    public entry fun withdraw(account: &signer, amount: u64) acquires Vault, UserStake, Rewards {
        assert!(amount > 0, EINVALID_AMOUNT);
        
        let account_addr = signer::address_of(account);
        let vault = borrow_global_mut<Vault>(@example);
        let user_stake = borrow_global_mut<UserStake>(account_addr);
        let rewards = borrow_global_mut<Rewards>(account_addr);

        assert!(user_stake.amount >= amount, EINSUFFICIENT_BALANCE);

        // Update rewards
        _update_reward(vault, user_stake, rewards);

        // Update staking
        user_stake.amount = user_stake.amount - amount;
        user_stake.voting_power = user_stake.amount;
        vault.total_staked = vault.total_staked - amount;

        // Emit event
        let withdraw_event = WithdrawEvent {
            user: account_addr,
            amount,
            timestamp: timestamp::now_seconds(),
        };
        event::emit(withdraw_event);
    }

    // Claim rewards
    public entry fun claim_rewards(account: &signer) acquires Vault, UserStake, Rewards {
        let account_addr = signer::address_of(account);
        let vault = borrow_global_mut<Vault>(@example);
        let user_stake = borrow_global_mut<UserStake>(account_addr);
        let rewards = borrow_global_mut<Rewards>(account_addr);

        // Update rewards
        _update_reward(vault, user_stake, rewards);

        let reward_amount = rewards.pending_rewards;
        assert!(reward_amount > 0, EREWARD_NOT_READY);

        rewards.pending_rewards = 0;
        rewards.last_claim_time = timestamp::now_seconds();

        // Emit event
        let reward_event = RewardClaimEvent {
            user: account_addr,
            amount: reward_amount,
            timestamp: timestamp::now_seconds(),
        };
        event::emit(reward_event);
    }

    // Create a proposal
    public entry fun create_proposal(account: &signer, description: String) acquires Vault, UserStake {
        let account_addr = signer::address_of(account);
        let vault = borrow_global_mut<Vault>(@example);
        let user_stake = borrow_global<UserStake>(account_addr);

        assert!(user_stake.amount >= MINIMUM_STAKE, EINSUFFICIENT_VOTING_POWER);

        let proposal_id = vault.proposal_count;
        vault.proposal_count = vault.proposal_count + 1;

        move_to(account, Proposal {
            id: proposal_id,
            description,
            for_votes: 0,
            against_votes: 0,
            start_time: timestamp::now_seconds(),
            executed: false,
            canceled: false,
            creator: account_addr,
        });

        // Emit event
        let proposal_event = ProposalCreatedEvent {
            proposal_id,
            description: string::utf8(b"New proposal created"),
            creator: account_addr,
            timestamp: timestamp::now_seconds(),
        };
        event::emit(proposal_event);
    }

    // Vote on a proposal
    public entry fun vote(account: &signer, proposal_id: u64, support: bool) acquires Vault, UserStake, Proposal, Vote {
        let account_addr = signer::address_of(account);
        let vault = borrow_global<Vault>(@example);
        let user_stake = borrow_global<UserStake>(account_addr);

        assert!(proposal_id < vault.proposal_count, EPROPOSAL_NOT_FOUND);
        assert!(user_stake.amount >= MINIMUM_STAKE, EINSUFFICIENT_VOTING_POWER);

        let proposal = borrow_global_mut<Proposal>(@example);
        assert!(!proposal.executed, EVOTING_PERIOD_ENDED);
        assert!(timestamp::now_seconds() < proposal.start_time + vault.voting_period, EVOTING_PERIOD_ENDED);

        // Check if user has already voted
        if (exists<Vote>(account_addr)) {
            let vote = borrow_global<Vote>(account_addr);
            assert!(!vote.has_voted, EALREADY_VOTED);
        };

        // Record vote
        move_to(account, Vote {
            has_voted: true,
            support,
            voting_power: user_stake.voting_power,
        });

        // Update proposal votes
        if (support) {
            proposal.for_votes = proposal.for_votes + user_stake.voting_power;
        } else {
            proposal.against_votes = proposal.against_votes + user_stake.voting_power;
        };

        // Emit event
        let vote_event = VoteEvent {
            proposal_id,
            voter: account_addr,
            support,
            voting_power: user_stake.voting_power,
            timestamp: timestamp::now_seconds(),
        };
        event::emit(vote_event);
    }

    // Execute a proposal
    public entry fun execute_proposal(account: &signer, proposal_id: u64) acquires Vault, Proposal {
        let account_addr = signer::address_of(account);
        let vault = borrow_global<Vault>(@example);
        let proposal = borrow_global_mut<Proposal>(@example);

        assert!(account_addr == vault.owner, ENOT_AUTHORIZED);
        assert!(proposal_id < vault.proposal_count, EPROPOSAL_NOT_FOUND);
        assert!(!proposal.executed, EVOTING_PERIOD_ENDED);
        assert!(!proposal.canceled, EVOTING_PERIOD_ENDED);
        assert!(timestamp::now_seconds() >= proposal.start_time + vault.voting_period, EVOTING_PERIOD_ENDED);
        assert!(proposal.for_votes > proposal.against_votes, EVOTING_PERIOD_ENDED);
        assert!(proposal.for_votes + proposal.against_votes >= vault.quorum, EVOTING_PERIOD_ENDED);

        proposal.executed = true;

        // Emit event
        let execute_event = ProposalExecutedEvent {
            proposal_id,
            timestamp: timestamp::now_seconds(),
        };
        event::emit(execute_event);
    }

    // View functions
    public fun get_vault_info(): (u64, u64, u64, u64) acquires Vault {
        let vault = borrow_global<Vault>(@example);
        (vault.total_staked, vault.reward_per_token, vault.reward_rate, vault.proposal_count)
    }

    public fun get_user_stake(user: address): (u64, u64, u64, u64) acquires UserStake {
        if (exists<UserStake>(user)) {
            let user_stake = borrow_global<UserStake>(user);
            (user_stake.amount, user_stake.reward_debt, user_stake.last_claim_time, user_stake.voting_power)
        } else {
            (0, 0, 0, 0)
        }
    }

    public fun get_proposal_info(proposal_id: u64): (String, u64, u64, u64, bool, bool, address) acquires Proposal {
        let proposal = borrow_global<Proposal>(@example);
        (
            proposal.description,
            proposal.for_votes,
            proposal.against_votes,
            proposal.start_time,
            proposal.executed,
            proposal.canceled,
            proposal.creator
        )
    }

    public fun get_pending_rewards(user: address): u64 acquires Rewards {
        if (exists<Rewards>(user)) {
            let rewards = borrow_global<Rewards>(user);
            rewards.pending_rewards
        } else {
            0
        }
    }

    public fun has_voted(user: address): bool acquires Vote {
        if (exists<Vote>(user)) {
            let vote = borrow_global<Vote>(user);
            vote.has_voted
        } else {
            false
        }
    }

    // Admin functions
    public entry fun set_reward_rate(account: &signer, new_rate: u64) acquires Vault {
        let account_addr = signer::address_of(account);
        let vault = borrow_global_mut<Vault>(@example);
        
        assert!(account_addr == vault.owner, ENOT_AUTHORIZED);
        assert!(new_rate <= 1000, EINVALID_AMOUNT); // Max 10%
        
        vault.reward_rate = new_rate;
    }

    public entry fun set_voting_period(account: &signer, new_period: u64) acquires Vault {
        let account_addr = signer::address_of(account);
        let vault = borrow_global_mut<Vault>(@example);
        
        assert!(account_addr == vault.owner, ENOT_AUTHORIZED);
        assert!(new_period >= 86400 && new_period <= 2592000, EINVALID_AMOUNT); // 1-30 days
        
        vault.voting_period = new_period;
    }

    public entry fun set_quorum(account: &signer, new_quorum: u64) acquires Vault {
        let account_addr = signer::address_of(account);
        let vault = borrow_global_mut<Vault>(@example);
        
        assert!(account_addr == vault.owner, ENOT_AUTHORIZED);
        
        vault.quorum = new_quorum;
    }

    // Internal functions
    fun _update_reward(vault: &mut Vault, user_stake: &mut UserStake, rewards: &mut Rewards) {
        let current_time = timestamp::now_seconds();
        let time_diff = current_time - vault.last_update_time;
        
        if (vault.total_staked > 0) {
            let reward_increase = (time_diff * vault.reward_rate * BASIS_POINTS) / vault.total_staked;
            vault.reward_per_token = vault.reward_per_token + reward_increase;
        };
        
        vault.last_update_time = current_time;
        
        let earned_rewards = (user_stake.amount * (vault.reward_per_token - user_stake.reward_debt)) / BASIS_POINTS;
        user_stake.reward_debt = vault.reward_per_token;
        
        rewards.pending_rewards = rewards.pending_rewards + earned_rewards;
    }

    // Test helper functions
    #[test_only]
    public fun initialize_for_testing(account: &signer) {
        initialize(account);
    }

    #[test_only]
    public fun get_test_vault(): Vault {
        *borrow_global<Vault>(@example)
    }

    #[test_only]
    public fun get_test_user_stake(user: address): UserStake {
        *borrow_global<UserStake>(user)
    }
} 