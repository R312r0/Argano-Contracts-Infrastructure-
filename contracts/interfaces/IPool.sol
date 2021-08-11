// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;


interface IPool {
    function collateralDollarBalance() external view returns (uint256);

    function migrate(address _new_pool) external;

    function transferCollateralToTreasury(uint256 amount) external;

    function getCollateralPrice() external view returns (uint256);

    function getCollateralToken() external view returns (address);

    function getMissing_decimals() external view returns (uint256);
}
