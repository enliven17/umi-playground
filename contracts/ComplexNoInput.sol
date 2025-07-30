// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ComplexNoInput {
    // State
    mapping(address => uint256) public balances;
    mapping(address => bool) public isAdmin;
    address[] public users;
    uint256 public totalSupply;
    uint256 public voteCount;
    mapping(address => bool) public hasVoted;
    string public systemMessage;

    // Events
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event Voted(address indexed user, string message);
    event SystemMessageChanged(string newMessage);

    // Modifiers
    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Not admin");
        _;
    }

    constructor() {
        isAdmin[msg.sender] = true;
        systemMessage = "Welcome to ComplexNoInput!";
    }

    // Deposit/Withdraw
    function deposit() external payable {
        require(msg.value > 0, "No value");
        if (balances[msg.sender] == 0) users.push(msg.sender);
        balances[msg.sender] += msg.value;
        totalSupply += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient");
        balances[msg.sender] -= amount;
        totalSupply -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdraw(msg.sender, amount);
    }

    // Admin management
    function addAdmin(address user) external onlyAdmin {
        isAdmin[user] = true;
        emit AdminAdded(user);
    }
    function removeAdmin(address user) external onlyAdmin {
        isAdmin[user] = false;
        emit AdminRemoved(user);
    }

    // Voting (one vote per user)
    function vote(string calldata message) external {
        require(!hasVoted[msg.sender], "Already voted");
        hasVoted[msg.sender] = true;
        voteCount++;
        emit Voted(msg.sender, message);
    }

    // Batch transfer (admin only)
    function batchTransfer(address[] calldata recipients, uint256[] calldata amounts) external onlyAdmin {
        require(recipients.length == amounts.length, "Length mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            require(balances[msg.sender] >= amounts[i], "Insufficient");
            balances[msg.sender] -= amounts[i];
            balances[recipients[i]] += amounts[i];
            emit Deposit(recipients[i], amounts[i]);
        }
    }

    // System message (admin only)
    function setSystemMessage(string calldata newMsg) external onlyAdmin {
        systemMessage = newMsg;
        emit SystemMessageChanged(newMsg);
    }

    // Utility
    function getAllUsers() external view returns (address[] memory) {
        return users;
    }
} 