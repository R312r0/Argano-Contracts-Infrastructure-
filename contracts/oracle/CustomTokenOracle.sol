// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IPairOracle.sol";
import "../interfaces/IOracle.sol";


contract CustomTokenOracle is Ownable, IOracle {
    address public customToken;
    IPairOracle oracleCustomTokenCollateral;
    AggregatorV3Interface public priceFeed;
    uint8 public decimals;
    uint256 private constant PRICE_PRECISION = 1e18;
    
    event oracleCustomTokenCollateralChanged(IPairOracle _newOracle);

    constructor(
        address _customToken,
        IPairOracle _oracleCustomTokenCollateral,//pairOracle
        address _chainlinkCollateralUsd
    ){
        customToken = _customToken;
        setOracleCustomTokenCollateral(_oracleCustomTokenCollateral);
        priceFeed = AggregatorV3Interface(_chainlinkCollateralUsd);
        decimals = priceFeed.decimals();
    }

    function consult() external view override returns (uint256) {
        uint256 _priceCustomTokenCollateral = oracleCustomTokenCollateral.consult(customToken, PRICE_PRECISION);
        return priceCollateralUsd() * _priceCustomTokenCollateral / PRICE_PRECISION;
    }
    
    function updateIfRequired() external override{
        oracleCustomTokenCollateral.updateIfRequiered();
    }

    function priceCollateralUsd() internal view returns (uint256) {
        (, int256 _price, , , ) = priceFeed.latestRoundData();
        return uint256(_price) * PRICE_PRECISION / (uint256(10)**decimals);
    }

    function setOracleCustomTokenCollateral(IPairOracle _oracleCustomTokenCollateral) public onlyOwner {
        require(_oracleCustomTokenCollateral != IPairOracle(address(0)), "!pairOracle");
        oracleCustomTokenCollateral = _oracleCustomTokenCollateral;
        emit oracleCustomTokenCollateralChanged(oracleCustomTokenCollateral);
    }
}
