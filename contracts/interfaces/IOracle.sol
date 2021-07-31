// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

interface IOracle {
    function consult() external view returns (uint256);
    function updateIfRequired() external;
}
