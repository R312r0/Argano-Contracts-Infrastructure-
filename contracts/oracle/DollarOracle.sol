// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;
pragma experimental ABIEncoderV2;


library SafeMath {
  function mul(uint256 a, uint256 b) internal pure returns (uint256 c) {
    if (a == 0) {return 0;}
    c = a * b;
    assert(c / a == b);
    return c;
  }

  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    return a / b;
  }

  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  function add(uint256 a, uint256 b) internal pure returns (uint256 c) {
    c = a + b;
    assert(c >= a);
    return c;
  }
}

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);
    function latestAnswer() external view returns(int256);
    function getRoundData(uint80 _roundId) external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

interface IOracle {
    function consult() external view returns (uint256);
}

interface IPairOracle {
    function consult(address token, uint256 amountIn) external view returns (uint256 amountOut);
    function update() external;
}

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        this;
        return msg.data;
    }
}

abstract contract Ownable is Context {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor () {
        address msgSender = _msgSender();
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    function renounceOwnership() public virtual onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

abstract contract Operator is Context, Ownable {
    address private _operator;

    event OperatorTransferred(address indexed previousOperator, address indexed newOperator);

    constructor(){
        _operator = _msgSender();
        emit OperatorTransferred(address(0), _operator);
    }

    function operator() public view returns (address) {
        return _operator;
    }

    modifier onlyOperator() {
        require(_operator == msg.sender, "operator: caller is not the operator");
        _;
    }

    function isOperator() public view returns (bool) {
        return _msgSender() == _operator;
    }

    function transferOperator(address newOperator_) public onlyOwner {
        _transferOperator(newOperator_);
    }

    function _transferOperator(address newOperator_) internal {
        require(newOperator_ != address(0), "operator: zero address given for new operator");
        emit OperatorTransferred(address(0), newOperator_);
        _operator = newOperator_;
    }
}

contract DollarOracle is Operator, IOracle {
    using SafeMath for uint256;
    address public dollar;
    address public oracleAGOUSDUSDT;
    address public chainlinkUsdtUsd = 0x0A6513e40db6EB1b165753AD52E80663aeA50545;

    uint256 private constant PRICE_PRECISION = 1e18;

    constructor(
        address _dollar,
        address _oracleAGOUSDUSDT,
        address _chainlinkUsdtUsd
    ){
        dollar = _dollar;
        oracleAGOUSDUSDT = _oracleAGOUSDUSDT;
        chainlinkUsdtUsd = _chainlinkUsdtUsd;
    }

    function consult() external view override returns (uint256) {
        uint256 _priceUsdtUsd = priceUsdtUsd();
        uint256 _priceAGOUSDUSDT = IPairOracle(oracleAGOUSDUSDT).consult(dollar, PRICE_PRECISION);
        return _priceUsdtUsd.mul(_priceAGOUSDUSDT).div(PRICE_PRECISION);
    }

    function priceUsdtUsd() internal view returns (uint256) {
        AggregatorV3Interface _priceFeed = AggregatorV3Interface(chainlinkUsdtUsd);
        (, int256 _price, , , ) = _priceFeed.latestRoundData();
        uint8 _decimals = _priceFeed.decimals();
        return uint256(_price).mul(PRICE_PRECISION).div(uint256(10)**_decimals);
    }

    function setchainlinkUsdtUsd(address _chainlinkUsdtUsd) external onlyOperator {
        chainlinkUsdtUsd = _chainlinkUsdtUsd;
    }

    function setOracleAGOUSDUSDT(address _oracleAGOUSDUSDT) external onlyOperator {
        oracleAGOUSDUSDT = _oracleAGOUSDUSDT;
    }
}
