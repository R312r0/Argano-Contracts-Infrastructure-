//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ARGANO is ERC20, Ownable {
    constructor() ERC20("Argano", "AGO") {
        _mint(msg.sender, 65000000 ether);
    }
}