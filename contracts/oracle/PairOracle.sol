// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../libs/FixedPoint.sol";
import "../interfaces/IPairOracle.sol";
import "../interfaces/IUniswapLP.sol";

contract PairOracle is Ownable, IPairOracle {
    using FixedPoint for *;

    uint256 public constant PERIOD = 600; // 10-minute TWAP (time-weighted average price)// New oracle will be deployed if need change this value

    IUniswapLP public immutable pair;
    address public immutable token0;
    address public immutable token1;

    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;
    uint32 public blockTimestampLast;
    FixedPoint.uq112x112 public price0Average;
    FixedPoint.uq112x112 public price1Average;

    constructor(address pairAddress) {
        require(pairAddress!=address(0), "!pairAddress");
        IUniswapLP _pair = IUniswapLP(pairAddress);
        pair = _pair;
        token0 = _pair.token0();
        token1 = _pair.token1();
        price0CumulativeLast = _pair.price0CumulativeLast(); // Fetch the current accumulated price value (1 / 0)
        price1CumulativeLast = _pair.price1CumulativeLast(); // Fetch the current accumulated price value (0 / 1)
        uint112 reserve0;
        uint112 reserve1;
        (reserve0, reserve1, blockTimestampLast) = _pair.getReserves();
        require(reserve0 != 0 && reserve1 != 0, "PairOracle: NO_RESERVES"); // Ensure that there's liquidity in the pair
    }

    function update() public override {
        require(updateRequiered(), "PairOracle: PERIOD_NOT_ELAPSED");
        (uint256 price0Cumulative, uint256 price1Cumulative, uint32 blockTimestamp) = currentCumulativePrices(address(pair));
        unchecked{  
            uint32 timeElapsed = blockTimestamp - blockTimestampLast;
            // Ensure that at least one full period has passed since the last update
    
            // Overflow is desired, casting never truncates
            // Cumulative price is in (uq112x112 price * seconds) units so we simply wrap it after division by time elapsed
            price0Average = FixedPoint.uq112x112(uint224((price0Cumulative - price0CumulativeLast) / timeElapsed));
            price1Average = FixedPoint.uq112x112(uint224((price1Cumulative - price1CumulativeLast) / timeElapsed));
            price0CumulativeLast = price0Cumulative;
            price1CumulativeLast = price1Cumulative;
            blockTimestampLast = blockTimestamp;
        }
    }
    
    function updateIfRequiered() external override{
        if (updateRequiered()) update();
    }
    
    function updateRequiered() public view returns (bool is_update_required){
        uint32 timeElapsed = uint32(block.timestamp) - blockTimestampLast;
        return timeElapsed >= PERIOD;
    }

    // Note this will always return 0 before update has been called successfully for the first time.
    function consult(address token, uint256 amountIn) external view override returns (uint256 amountOut) {
        if (token == token0) {
            amountOut = price0Average.mul(amountIn).decode144();
        } else {
            require(token == token1, "PairOracle: INVALID_TOKEN");
            amountOut = price1Average.mul(amountIn).decode144();
        }
    }

    function currentBlockTimestamp() internal view returns (uint32) {
        return uint32(block.timestamp % 2**32);
    }

    // produces the cumulative price using counterfactuals to save gas and avoid a call to sync.
    function currentCumulativePrices(address _pair) internal view returns (
        uint256 price0Cumulative,
        uint256 price1Cumulative,
        uint32 blockTimestamp
    ){
        blockTimestamp = currentBlockTimestamp();
        IUniswapLP uniswapPair = IUniswapLP(_pair);
        price0Cumulative = uniswapPair.price0CumulativeLast();
        price1Cumulative = uniswapPair.price1CumulativeLast();

        (uint112 reserve0, uint112 reserve1, uint32 _blockTimestampLast) = uniswapPair.getReserves();
        if (_blockTimestampLast != blockTimestamp) {
            unchecked{  
                uint32 timeElapsed = blockTimestamp - _blockTimestampLast;
                price0Cumulative += uint256(FixedPoint.fraction(reserve1, reserve0)._x) * timeElapsed;
                price1Cumulative += uint256(FixedPoint.fraction(reserve0, reserve1)._x) * timeElapsed;
            }
        }
    }
}
