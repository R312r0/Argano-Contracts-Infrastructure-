// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ShareWrapper {
    using SafeERC20 for IERC20;

    address public share;
    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function stake(uint256 amount) public virtual {
        _totalSupply = _totalSupply + amount;
        _balances[msg.sender] = _balances[msg.sender] + amount;
        IERC20(share).safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) public virtual {
        uint256 blacksmithShare = _balances[msg.sender];
        require(blacksmithShare >= amount, "Boardroom: withdraw request greater than staked amount");
        _totalSupply = _totalSupply - amount;
        _balances[msg.sender] = blacksmithShare - amount;
        IERC20(share).safeTransfer(msg.sender, amount);
    }
}
