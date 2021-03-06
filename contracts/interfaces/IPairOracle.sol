// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

interface IPairOracle {
    function consult(address token, uint256 amountIn) external view returns (uint256 amountOut);
    function update() external;
    function updateIfRequiered() external;
}
