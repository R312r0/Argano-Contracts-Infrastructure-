// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "../chainLink/AggregatorV3Interface.sol";
import "../openZeppelin/SafeMath.sol";
import "../Operator.sol";
import "../interfaces/IOracle.sol";

contract USDTOracle is Operator, IOracle {
    using SafeMath for uint256;
    address public chainlinkUSDTUsd = 0x0A6513e40db6EB1b165753AD52E80663aeA50545;//usdt-usd on polygon

    uint256 private constant PRICE_PRECISION = 1e6;

    function consult() external view override returns (uint256) {
        AggregatorV3Interface _priceFeed = AggregatorV3Interface(chainlinkUSDTUsd);
        (, int256 _price, , , ) = _priceFeed.latestRoundData();
        uint8 _decimals = _priceFeed.decimals();
        return uint256(_price).mul(PRICE_PRECISION).div(uint256(10)**_decimals);
    }

    function setChainlinkUsdtUsd(address _chainlinkUSDTUsd) external onlyOperator {
        chainlinkUSDTUsd = _chainlinkUSDTUsd;
    }
}
