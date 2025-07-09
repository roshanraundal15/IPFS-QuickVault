// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FileStorage {
    struct FileData {
        address owner;
        string fileHash;
        bytes signature;
        uint256 timestamp;
    }

    mapping(string => FileData) private fileRecords;

    event FileStored(address indexed owner, string fileHash, bytes signature, uint256 timestamp);

    modifier validHash(string memory _fileHash) {
        require(bytes(_fileHash).length > 0, "File hash cannot be empty!");
        _;
    }

    function storeFileHash(string memory _fileHash, bytes memory _signature) public validHash(_fileHash) {
        require(fileRecords[_fileHash].owner == address(0), "File already exists!");

        fileRecords[_fileHash] = FileData({
            owner: msg.sender,
            fileHash: _fileHash,
            signature: _signature,
            timestamp: block.timestamp
        });

        emit FileStored(msg.sender, _fileHash, _signature, block.timestamp);
    }

    function verifyFile(string memory _fileHash) public view returns (address owner, bool exists) {
        FileData storage file = fileRecords[_fileHash];
        owner = file.owner;
        exists = (owner != address(0));
    }

    function getFileDetails(string memory _fileHash) public view returns (address owner, bytes memory signature, uint256 timestamp) {
        require(fileRecords[_fileHash].owner != address(0), "File not found!");
        
        FileData storage file = fileRecords[_fileHash];
        return (file.owner, file.signature, file.timestamp);
    }
}
