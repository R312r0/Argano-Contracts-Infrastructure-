//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ARGANO is ERC20, Ownable {
    constructor(
        string memory _name, 
        string memory _symbol,
        uint256 _initialSupply
    ) ERC20( _name, _symbol) {
        _mint(msg.sender, _initialSupply);//manual distribution desired
    }
}