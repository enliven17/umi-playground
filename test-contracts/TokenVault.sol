// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenVault
 * @dev A complex staking vault with rewards, governance, and emergency features
 */
contract TokenVault is ReentrancyGuard, Ownable {
    // Token contract
    IERC20 public stakingToken;
    IERC20 public rewardToken;
    
    // Staking parameters
    uint256 public totalStaked;
    uint256 public rewardRate = 100; // 1% = 100 basis points
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 public constant REWARD_DURATION = 30 days;
    uint256 public constant BASIS_POINTS = 10000;
    
    // User staking info
    struct UserStake {
        uint256 amount;
        uint256 rewardDebt;
        uint256 lastClaimTime;
        bool isStaking;
    }
    
    mapping(address => UserStake) public userStakes;
    
    // Governance
    uint256 public proposalCount;
    uint256 public votingPeriod = 3 days;
    uint256 public quorum = 1000 * 10**18; // 1000 tokens minimum
    
    struct Proposal {
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        bool executed;
        bool canceled;
        mapping(address => bool) hasVoted;
    }
    
    mapping(uint256 => Proposal) public proposals;
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event ProposalCreated(uint256 indexed proposalId, string description);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalExecuted(uint256 indexed proposalId);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    
    // Modifiers
    modifier onlyStaker() {
        require(userStakes[msg.sender].isStaking, "Not a staker");
        _;
    }
    
    modifier proposalExists(uint256 proposalId) {
        require(proposalId < proposalCount, "Proposal does not exist");
        _;
    }
    
    modifier proposalActive(uint256 proposalId) {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed && !proposal.canceled, "Proposal not active");
        require(block.timestamp < proposal.startTime + votingPeriod, "Voting period ended");
        _;
    }
    
    constructor(address _stakingToken, address _rewardToken) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        lastUpdateTime = block.timestamp;
    }
    
    /**
     * @dev Stake tokens into the vault
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        _updateReward(msg.sender);
        
        UserStake storage userStake = userStakes[msg.sender];
        userStake.amount += amount;
        userStake.isStaking = true;
        userStake.lastClaimTime = block.timestamp;
        
        totalStaked += amount;
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @dev Withdraw staked tokens
     */
    function withdraw(uint256 amount) external nonReentrant onlyStaker {
        UserStake storage userStake = userStakes[msg.sender];
        require(amount > 0, "Cannot withdraw 0");
        require(amount <= userStake.amount, "Insufficient staked amount");
        
        _updateReward(msg.sender);
        
        userStake.amount -= amount;
        totalStaked -= amount;
        
        if (userStake.amount == 0) {
            userStake.isStaking = false;
        }
        
        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit Withdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Claim accumulated rewards
     */
    function claimReward() external nonReentrant onlyStaker {
        _updateReward(msg.sender);
        
        UserStake storage userStake = userStakes[msg.sender];
        uint256 reward = userStake.rewardDebt;
        
        require(reward > 0, "No rewards to claim");
        
        userStake.rewardDebt = 0;
        userStake.lastClaimTime = block.timestamp;
        
        require(rewardToken.transfer(msg.sender, reward), "Reward transfer failed");
        
        emit RewardClaimed(msg.sender, reward);
    }
    
    /**
     * @dev Create a new governance proposal
     */
    function createProposal(string memory description) external onlyStaker {
        require(bytes(description).length > 0, "Empty description");
        
        uint256 proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.description = description;
        proposal.startTime = block.timestamp;
        
        emit ProposalCreated(proposalId, description);
    }
    
    /**
     * @dev Vote on a proposal
     */
    function vote(uint256 proposalId, bool support) external onlyStaker proposalExists(proposalId) proposalActive(proposalId) {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        proposal.hasVoted[msg.sender] = true;
        
        uint256 votingPower = userStakes[msg.sender].amount;
        
        if (support) {
            proposal.forVotes += votingPower;
        } else {
            proposal.againstVotes += votingPower;
        }
        
        emit Voted(proposalId, msg.sender, support);
    }
    
    /**
     * @dev Execute a proposal if it passed
     */
    function executeProposal(uint256 proposalId) external onlyOwner proposalExists(proposalId) {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");
        require(!proposal.canceled, "Proposal canceled");
        require(block.timestamp >= proposal.startTime + votingPeriod, "Voting period not ended");
        require(proposal.forVotes > proposal.againstVotes, "Proposal did not pass");
        require(proposal.forVotes + proposal.againstVotes >= quorum, "Quorum not reached");
        
        proposal.executed = true;
        
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @dev Emergency withdraw function
     */
    function emergencyWithdraw() external nonReentrant onlyStaker {
        UserStake storage userStake = userStakes[msg.sender];
        uint256 amount = userStake.amount;
        
        require(amount > 0, "Nothing to withdraw");
        
        userStake.amount = 0;
        userStake.rewardDebt = 0;
        userStake.isStaking = false;
        totalStaked -= amount;
        
        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit EmergencyWithdraw(msg.sender, amount);
    }
    
    /**
     * @dev Update reward for a user
     */
    function _updateReward(address user) internal {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        
        if (user != address(0)) {
            UserStake storage userStake = userStakes[user];
            userStake.rewardDebt = earned(user);
        }
    }
    
    /**
     * @dev Calculate reward per token
     */
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        
        return rewardPerTokenStored + (
            ((block.timestamp - lastUpdateTime) * rewardRate * BASIS_POINTS) / totalStaked
        );
    }
    
    /**
     * @dev Calculate earned rewards for a user
     */
    function earned(address user) public view returns (uint256) {
        UserStake storage userStake = userStakes[user];
        return (userStake.amount * (rewardPerToken() - userStake.rewardDebt)) / BASIS_POINTS;
    }
    
    /**
     * @dev Get user stake info
     */
    function getUserStake(address user) external view returns (
        uint256 amount,
        uint256 rewardDebt,
        uint256 lastClaimTime,
        bool isStaking
    ) {
        UserStake storage userStake = userStakes[user];
        return (userStake.amount, userStake.rewardDebt, userStake.lastClaimTime, userStake.isStaking);
    }
    
    /**
     * @dev Get proposal info
     */
    function getProposal(uint256 proposalId) external view proposalExists(proposalId) returns (
        string memory description,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 startTime,
        bool executed,
        bool canceled
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (proposal.description, proposal.forVotes, proposal.againstVotes, proposal.startTime, proposal.executed, proposal.canceled);
    }
    
    /**
     * @dev Check if user has voted on a proposal
     */
    function hasVoted(uint256 proposalId, address user) external view proposalExists(proposalId) returns (bool) {
        return proposals[proposalId].hasVoted[user];
    }
    
    /**
     * @dev Update reward rate (owner only)
     */
    function setRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 1000, "Rate too high"); // Max 10%
        rewardRate = newRate;
    }
    
    /**
     * @dev Update voting period (owner only)
     */
    function setVotingPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod >= 1 days && newPeriod <= 30 days, "Invalid period");
        votingPeriod = newPeriod;
    }
    
    /**
     * @dev Update quorum (owner only)
     */
    function setQuorum(uint256 newQuorum) external onlyOwner {
        quorum = newQuorum;
    }
    
    /**
     * @dev Withdraw stuck tokens (owner only)
     */
    function withdrawStuckTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
    }
} 