// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20.sol";
import "./IERC20.sol";

library SafeERC20 {
  function safeTransfer(IERC20 token, address to, uint256 value) internal{
    require(token.transfer(to, value));
  }

  function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal{
    require(token.transferFrom(from, to, value));
  }

  function safeApprove( IERC20 token, address spender, uint256 value) internal{
    require(token.approve(spender, value));
  }
}