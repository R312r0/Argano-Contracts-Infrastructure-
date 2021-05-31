// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "../chainLink/AggregatorV3Interface.sol";
import "../openZeppelin/SafeMath.sol";
import "../Operator.sol";
import "../interfaces/IOracle.sol";
import "../interfaces/IPairOracle.sol";

contract DollarOracle is Operator, IOracle {
    using SafeMath for uint256;
    address public oracleDollarUsdt;
    address public oracleUsdtUsd;
    address public dollar;

    uint256 private constant PRICE_PRECISION = 1e6;

    constructor(address _dollar, address _oracleDollarUsdt, address _oracleUsdtUsd){
        dollar = _dollar;
        oracleUsdtUsd = _oracleUsdtUsd;
        oracleDollarUsdt = _oracleDollarUsdt;
    }

    function consult() external view override returns (uint256) {
        uint256 _priceUsdtUsd = IOracle(oracleUsdtUsd).consult();
        uint256 _priceDollarUsdt = IPairOracle(oracleDollarUsdt).consult(dollar, PRICE_PRECISION);
        return _priceUsdtUsd.mul(_priceDollarUsdt).div(PRICE_PRECISION);
    }

    function setOracleUsdtUsd(address _oracleUsdtUsd) external onlyOperator {
        oracleUsdtUsd = _oracleUsdtUsd;
    }

    function setOracleDollarUsdt(address _oracleDollarUsdt) external onlyOperator {
        oracleDollarUsdt = _oracleDollarUsdt;
    }
}
