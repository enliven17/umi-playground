// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HelloWorld {
    string public message;
    address public owner;
    
    event MessageUpdated(string newMessage, address updatedBy);
    
    constructor() {
        message = "Hello, Umi World!";
        owner = msg.sender;
    }
    
    function updateMessage(string memory newMessage) public {
        require(msg.sender == owner, "Only owner can update message");
        message = newMessage;
        emit MessageUpdated(newMessage, msg.sender);
    }
    
    function getMessage() public view returns (string memory) {
        return message;
    }
    
    function getOwner() public view returns (address) {
        return owner;
    }
    
    function greet() public view returns (string memory) {
        return string(abi.encodePacked("Hello from ", message));
    }
} 