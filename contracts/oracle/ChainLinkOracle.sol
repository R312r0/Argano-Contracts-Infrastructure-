// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
//0xAB594600376Ec9fD91F8e885dADF0CE036862dE0 = Wcoin-usd chainlink price feed on polygon

contract ChainLinkOracle{
    uint256 private pricePrescion;
    AggregatorV3Interface public priceFeed;
    uint8 public decimals;
    
    constructor(address _chainlinkCollateralUsd, uint256 _pricePrescion){
        priceFeed = AggregatorV3Interface(_chainlinkCollateralUsd);
        decimals = priceFeed.decimals();
        pricePrescion = _pricePrescion;
    }

    function consult() external view returns (uint256) {
        (, int256 _price, , , ) = priceFeed.latestRoundData();
        return uint256(_price) * pricePrescion / (uint256(10)**decimals);
    }
}