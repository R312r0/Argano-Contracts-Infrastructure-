// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "../chainLink/AggregatorV3Interface.sol";
import "../openZeppelin/SafeMath.sol";
import "../Operator.sol";
import "../interfaces/IOracle.sol";
import "../interfaces/IPairOracle.sol";

contract ShareOracle is Operator, IOracle {
    using SafeMath for uint256;
    address public oracleCnusdMatic;
    address public chainlinkMaticUsd;
    address public share;

    uint256 private constant PRICE_PRECISION = 1e6;

    constructor(
        address _share,
        address _oracleCnusdMatic,
        address _chainlinkMaticUsd
    ){
        share = _share;
        chainlinkMaticUsd = _chainlinkMaticUsd;
        oracleCnusdMatic = _oracleCnusdMatic;
    }

    function consult() external view override returns (uint256) {
        uint256 _priceMaticUsd = priceMaticUsd();
        uint256 _priceCnusdMatic = IPairOracle(oracleCnusdMatic).consult(share, PRICE_PRECISION);
        return _priceMaticUsd.mul(_priceCnusdMatic).div(PRICE_PRECISION);
    }

    function priceMaticUsd() internal view returns (uint256) {
        AggregatorV3Interface _priceFeed = AggregatorV3Interface(chainlinkMaticUsd);
        (, int256 _price, , , ) = _priceFeed.latestRoundData();
        uint8 _decimals = _priceFeed.decimals();
        return uint256(_price).mul(PRICE_PRECISION).div(uint256(10)**_decimals);
    }

    function setChainlinkMaticUsd(address _chainlinkMaticUsd) external onlyOperator {
        chainlinkMaticUsd = _chainlinkMaticUsd;
    }

    function setOracleMaticUsd(address _oracleCnusdMatic) external onlyOperator {
        oracleCnusdMatic = _oracleCnusdMatic;
    }
}
