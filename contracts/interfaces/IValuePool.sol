// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

interface IValuePool {
    function getSpotPriceSansFee(address tokenIn, address tokenOut) external view returns (uint spotPrice);
}
