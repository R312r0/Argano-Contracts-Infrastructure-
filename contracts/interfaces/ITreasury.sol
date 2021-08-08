// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "./IEpoch.sol";

interface ITreasury is IEpoch {
    function hasPool(address _address) external view returns (bool);

    function info(address _caller)
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256
        );

    function epochInfo()
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        );
        
    function updateOracles() external;
}
