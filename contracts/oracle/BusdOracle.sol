// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "../chainLink/AggregatorV3Interface.sol";
import "../openZeppelin/SafeMath.sol";
import "../Operator.sol";
import "../interfaces/IOracle.sol";

contract BusdOracle is Operator, IOracle {
    using SafeMath for uint256;
    address public chainlinkBusdUsd;

    uint256 private constant PRICE_PRECISION = 1e6;

    constructor(address _chainlinkBusdUsd){
        chainlinkBusdUsd = _chainlinkBusdUsd;
    }

    function consult() external view override returns (uint256) {
        AggregatorV3Interface _priceFeed = AggregatorV3Interface(chainlinkBusdUsd);
        (, int256 _price, , , ) = _priceFeed.latestRoundData();
        uint8 _decimals = _priceFeed.decimals();
        return uint256(_price).mul(PRICE_PRECISION).div(uint256(10)**_decimals);
    }

    function setChainlinkBusdUsd(address _chainlinkBusdUsd) external onlyOperator {
        chainlinkBusdUsd = _chainlinkBusdUsd;
    }
}
