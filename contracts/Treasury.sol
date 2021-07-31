// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "./interfaces/IUniswapRouter.sol";
import "./interfaces/IFoundry.sol";
import "./interfaces/IPool.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/ITreasury.sol";

contract Treasury is ITreasury, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public oracleDollar;//custom token oracle
    address public oracleShare;//custom token oracle
    address public oracleGovToken;//custom token oracle

    address public dollar;
    address public share;
    address public governanceToken;
    address public wcoin;
    address public collateral;
    address public strategist;
    bool public migrated = false;

    // pools
    address[] public pools_array;
    mapping(address => bool) public pools;

    // Constants for various precisions
    uint256 private constant PRICE_PRECISION = 1e6;
    uint256 private constant RATIO_PRECISION = 1e6;

    // fees
    uint256 public redemption_fee = 4000; // 6 decimals of precision
    uint256 public minting_fee = 3000; // 6 decimals of precision

    // collateral_ratio
    uint256 public last_refresh_cr_timestamp;
    uint256 public target_collateral_ratio = 1000000; // = 100% - fully collateralized at start; // 6 decimals of precision
    uint256 public effective_collateral_ratio = 1000000; // = 100% - fully collateralized at start; // 6 decimals of precision
    uint256 public refresh_cooldown = 600; // Refresh cooldown period is set to 10min at genesis; // Seconds to wait before being able to run refreshCollateralRatio() again
    uint256 public ratio_step = 2500; // Amount to change the collateralization ratio by upon refreshCollateralRatio() // = 0.25% at 6 decimals of precision
    uint256 public price_target = 1000000; // = $1. (6 decimals of precision). Collateral ratio will adjust according to the $1 price target at genesis; // The price of dollar at which the collateral ratio will respond to; this value is only used for the collateral ratio mechanism and not for minting and redeeming which are hardcoded at $1
    uint256 public price_band = 5000; // The bound above and below the price target at which the Collateral ratio is allowed to drop
    uint256 public gov_token_value_for_discount = 1000;//1000$ in governance tokens
    uint256 private constant COLLATERAL_RATIO_MAX = 1e6;
    bool public collateral_ratio_paused = true; // during bootstraping phase, collateral_ratio will be fixed at 100%

    // rebalance
    address public rebalancing_pool;
    address public rebalancing_pool_collateral;
    uint256 public rebalance_cooldown = 12 hours;
    uint256 public last_rebalance_timestamp;

    // uniswap
    address public uniswap_router;

    // foundry
    uint256 public startTime;
    address public foundry;
    uint256 public excess_collateral_distributed_ratio = 50000; // 5% per epoch
    uint256 public lastEpochTime;
    uint256 public epoch_length;
    uint256 private _epoch = 0;

    /* ========== MODIFIERS ========== */
    
    modifier withOracleUpdates(){
        if (oracleDollar != address(0)) IOracle(oracleDollar).updateIfRequired();//custom token oracle
        if (oracleShare != address(0)) IOracle(oracleShare).updateIfRequired();//custom token oracle
        if (oracleGovToken != address(0)) IOracle(oracleGovToken).updateIfRequired();//custom token oracle
        _;
    }

    modifier notMigrated() {
        require(migrated == false, "migrated");
        _;
    }

    modifier hasRebalancePool() {
        require(rebalancing_pool != address(0), "!rebalancingPool");
        require(rebalancing_pool_collateral != address(0), "!rebalancingPoolCollateral");
        _;
    }

    modifier checkRebalanceCooldown() {
        uint256 _blockTimestamp = block.timestamp;
        require(_blockTimestamp - last_rebalance_timestamp >= rebalance_cooldown, "<rebalance_cooldown");
        _;
        last_rebalance_timestamp = _blockTimestamp;
    }

    modifier checkEpoch {
        uint256 _nextEpochPoint = nextEpochPoint();
        require(block.timestamp >= _nextEpochPoint, "Treasury: not opened yet");
        _;
        lastEpochTime = _nextEpochPoint;
        _epoch = _epoch + 1;
    }

    /* ========== EVENTS ============= */
    event TransactionExecuted(address indexed target, uint256 value, string signature, bytes data);
    event BoughtBack(uint256 collateral_value, uint256 collateral_amount, uint256 output_share_amount);
    event Recollateralized(uint256 share_amount, uint256 output_collateral_amount, uint256 output_collateral_value);

    constructor (uint256 _startTime, uint256 _epoch_length){
        require(_startTime >= block.timestamp, "Start time initialized to the past");
        startTime = _startTime;
        epoch_length = _epoch_length;
        lastEpochTime = _startTime - epoch_length;
    }

    /*=========== VIEWS ===========*/
    function dollarPrice() public view returns (uint256) {return IOracle(oracleDollar).consult();}
    function sharePrice() public view returns (uint256) {return IOracle(oracleShare).consult();}
    function gov_token_price() public view returns (uint256) {return IOracle(oracleGovToken).consult();}
    function hasPool(address _address) external view override returns (bool) {return pools[_address] == true;}
    function nextEpochPoint() public view override returns (uint256) {return lastEpochTime + epoch_length;}
    function epoch() public view override returns (uint256) {return _epoch;}

    function redemption_fee_adjusted() public view returns (uint256 redemptionFee) {
        if (governanceToken == address(0)) return redemption_fee;
        if (IERC20(governanceToken).balanceOf(tx.origin) > discount_requirenment() ) return redemption_fee / 2;
        return redemption_fee;
    }

    function discount_requirenment() public view returns (uint256) {
        uint256 govTokenPrice = gov_token_price();
        if (govTokenPrice == 0) return 1;
        uint256 decimals = IERC20Metadata(governanceToken).decimals();
        return  gov_token_value_for_discount * PRICE_PRECISION * 10**decimals / govTokenPrice;
    }

    function info() external view override returns (
        uint256,
        uint256,
        uint256,
        uint256,
        uint256,
        uint256,
        uint256,
        uint256
    ){
        return (
            dollarPrice(), 
            sharePrice(), 
            IERC20(dollar).totalSupply(), 
            target_collateral_ratio, 
            effective_collateral_ratio, 
            globalCollateralValue(),    
            minting_fee, 
            redemption_fee_adjusted()
        );
    }

    function epochInfo() external view override returns (
        uint256,
        uint256,
        uint256,
        uint256
    ){
        return (
            epoch(), 
            nextEpochPoint(), 
            epoch_length, 
            excess_collateral_distributed_ratio
        );
    }

    // Iterate through all pools and calculate all value of collateral in all pools globally
    function globalCollateralValue() public view returns (uint256) {
        uint256 total_collateral_value = 0;
        for (uint256 i = 0; i < pools_array.length; i++) {
            if (pools_array[i] != address(0)) {
                total_collateral_value = total_collateral_value + IPool(pools_array[i]).collateralDollarBalance();
            }
        }
        return total_collateral_value;
    }

    function calcEffectiveCollateralRatio() public view returns (uint256) {
        uint256 total_collateral_value = globalCollateralValue();
        uint256 total_supply_dollar = IERC20(dollar).totalSupply();
        uint256 ecr = total_collateral_value * PRICE_PRECISION / total_supply_dollar;
        if (ecr > COLLATERAL_RATIO_MAX) return COLLATERAL_RATIO_MAX;
        return ecr;
    }


    function refreshCollateralRatio() public withOracleUpdates{
        require(collateral_ratio_paused == false, "Collateral Ratio has been paused");
        require(block.timestamp - last_refresh_cr_timestamp >= refresh_cooldown, "Must wait for the refresh cooldown since last refresh");
        uint256 current_dollar_price = dollarPrice();
        
        if (current_dollar_price > price_target + price_band ) {
            if (target_collateral_ratio <= ratio_step) {// decrease collateral ratio
                target_collateral_ratio = 0;// if within a step of 0, go to 0
            } else {
                target_collateral_ratio = target_collateral_ratio - ratio_step;
            }
        }
        // Dollar price is below $1 - `price_band`. Need to increase `collateral_ratio`
        else if (current_dollar_price < price_target - price_band) {
            if (target_collateral_ratio + ratio_step >= COLLATERAL_RATIO_MAX) {// increase collateral ratio
                target_collateral_ratio = COLLATERAL_RATIO_MAX; // cap collateral ratio at 1.000000
            } else {
                target_collateral_ratio = target_collateral_ratio + ratio_step;
            }
        }

        effective_collateral_ratio = calcEffectiveCollateralRatio();
        last_refresh_cr_timestamp = block.timestamp;
    }

    // Check if the protocol is over- or under-collateralized, by how much
    function calcCollateralBalance() public view returns (uint256 _collateral_value, bool _exceeded) {
        uint256 total_collateral_value = globalCollateralValue();
        uint256 target_collateral_value = IERC20(dollar).totalSupply() * target_collateral_ratio / PRICE_PRECISION;
        if (total_collateral_value >= target_collateral_value) {
            _collateral_value = total_collateral_value - target_collateral_value;
            _exceeded = true;
        } else {
            _collateral_value = target_collateral_value - total_collateral_value;
            _exceeded = false;
        }
    }

    /* -========= INTERNAL FUNCTIONS ============ */

    // SWAP tokens using quickswap
    function _swap(
        address _input_token,
        uint256 _input_amount,
        uint256 _min_output_amount
    ) internal returns (uint256) {
        require(
            (_input_token == collateral || _input_token == share) &&
            uniswap_router != address(0) && 
            share != address(0) && 
            wcoin != address(0) &&
            collateral != address(0), 
            "badTokenReceivedForSwap"
        );
        if (_input_amount == 0) return 0;
        address[] memory _path = new address[](3);
        if (_input_token == share) {
            _path[0] = share;
            _path[1] = wcoin;
            _path[2] = collateral;
        } else if(_input_token == collateral) {
            _path[0] = collateral;
            _path[1] = wcoin;
            _path[2] = share;
        }
        
        IERC20(_input_token).safeApprove(uniswap_router, 0);
        IERC20(_input_token).safeApprove(uniswap_router, _input_amount);
        uint256[] memory out_amounts = IUniswapRouter(uniswap_router).swapExactTokensForTokens(_input_amount, _min_output_amount, _path, address(this), block.timestamp + 1800);
        return out_amounts[out_amounts.length - 1];
    }
    /* ========== RESTRICTED FUNCTIONS ========== */

    // Add new Pool
    function addPool(address pool_address) public onlyOwner notMigrated {
        require(pools[pool_address] == false, "poolExisted");
        pools[pool_address] = true;
        pools_array.push(pool_address);
    }

    // Remove a pool
    function removePool(address pool_address) public onlyOwner notMigrated {
        require(rebalancing_pool != pool_address, "Cant`t delete active rebalance pool");
        require(pools[pool_address] == true, "!pool");        
        delete pools[pool_address];// Delete from the mapping
        for (uint256 i = 0; i < pools_array.length; i++) {
            if (pools_array[i] == pool_address) {
                pools_array[i] = address(0); // This will leave a null in the array and keep the indices the same
                break;
            }
        }
    }

    // SINGLE POOL STRATEGY
    // With Treasury v1, we will only utilize collateral from a single pool to do rebalancing
    function buyback(uint256 _collateral_value, uint256 _min_share_amount) external onlyOwner withOracleUpdates notMigrated hasRebalancePool checkRebalanceCooldown {
        (uint256 _excess_collateral_value, bool _exceeded) = calcCollateralBalance();
        require(_exceeded && _excess_collateral_value > 0, "!exceeded");
        require(_collateral_value > 0 && _collateral_value < _excess_collateral_value, "invalidCollateralAmount");
        uint256 _collateral_price = IPool(rebalancing_pool).getCollateralPrice();
        uint256 _collateral_amount_sell = _collateral_value * PRICE_PRECISION / _collateral_price;
        require(IERC20(rebalancing_pool_collateral).balanceOf(rebalancing_pool) > _collateral_amount_sell, "insufficentPoolBalance");
        IPool(rebalancing_pool).transferCollateralToTreasury(_collateral_amount_sell); // Transfer collateral from pool to treasury
        uint256 out_share_amount = _swap(rebalancing_pool_collateral, _collateral_amount_sell, _min_share_amount);
        emit BoughtBack(_collateral_value, _collateral_amount_sell, out_share_amount);
    }

    // SINGLE POOL STRATEGY
    // With Treasury v1, we will only utilize collateral from a single pool to do rebalancing
    function recollateralize(uint256 _share_amount, uint256 _min_collateral_amount) external onlyOwner withOracleUpdates notMigrated hasRebalancePool checkRebalanceCooldown {
        (uint256 _deficit_collateral_value, bool _exceeded) = calcCollateralBalance();
        require(!_exceeded && _deficit_collateral_value > 0, "exceeded");
        require(_min_collateral_amount <= _deficit_collateral_value, ">deficit");
        uint256 _share_balance = IERC20(share).balanceOf(address(this));
        require(_share_amount <= _share_balance, ">shareBalance");
        uint256 out_collateral_amount = _swap(share, _share_amount, _min_collateral_amount);
        uint256 _collateral_balance = IERC20(rebalancing_pool_collateral).balanceOf(address(this));
        if (_collateral_balance > 0) {
            IERC20(rebalancing_pool_collateral).safeTransfer(rebalancing_pool, _collateral_balance); // Transfer collateral from Treasury to Pool
        }
        uint256 collateral_price = IPool(rebalancing_pool).getCollateralPrice();
        uint256 out_collateral_value = out_collateral_amount * collateral_price / PRICE_PRECISION;
        emit Recollateralized(_share_amount, out_collateral_amount, out_collateral_value);
    }

    function allocateSeigniorage() external withOracleUpdates notMigrated nonReentrant checkEpoch {
        require(!migrated, "Treasury: migrated");
        require(block.timestamp >= startTime, "Treasury: not started yet");
        (uint256 _excess_collateral_value, bool _exceeded) = calcCollateralBalance();
        uint256 _allocation_value = 0;
        if (_exceeded) {
            _allocation_value = _excess_collateral_value * excess_collateral_distributed_ratio / RATIO_PRECISION;
            uint256 collateral_price = IPool(rebalancing_pool).getCollateralPrice();
            uint256 _allocation_amount = _allocation_value * PRICE_PRECISION / collateral_price;
            IPool(rebalancing_pool).transferCollateralToTreasury(_allocation_amount); // Transfer collateral from pool to treasury
            IERC20(rebalancing_pool_collateral).safeApprove(foundry, 0);
            IERC20(rebalancing_pool_collateral).safeApprove(foundry, _allocation_amount);
            IFoundry(foundry).allocateSeigniorage(_allocation_amount);
        }
    }

    function migrate(address _new_treasury) external onlyOwner notMigrated {
        migrated = true;
        uint256 _share_balance = IERC20(share).balanceOf(address(this));
        if (_share_balance > 0) {
            IERC20(share).safeTransfer(_new_treasury, _share_balance);
        }
        if (rebalancing_pool_collateral != address(0)) {
            uint256 _collateral_balance = IERC20(rebalancing_pool_collateral).balanceOf(address(this));
            if (_collateral_balance > 0) {
                IERC20(rebalancing_pool_collateral).safeTransfer(_new_treasury, _collateral_balance);
            }
        }
    }

    function setGovTokenValueForDiscount(uint256 value) public onlyOwner {gov_token_value_for_discount = value;}
    function setRedemptionFee(uint256 _redemption_fee) public onlyOwner {redemption_fee = _redemption_fee;}
    function setMintingFee(uint256 _minting_fee) public onlyOwner {minting_fee = _minting_fee;}
    function setRatioStep(uint256 _ratio_step) public onlyOwner {ratio_step = _ratio_step;}
    function setPriceTarget(uint256 _price_target) public onlyOwner {price_target = _price_target;}
    function setRefreshCooldown(uint256 _refresh_cooldown) public onlyOwner {refresh_cooldown = _refresh_cooldown;}
    function setPriceBand(uint256 _price_band) external onlyOwner {price_band = _price_band;}
    function toggleCollateralRatio() public onlyOwner {collateral_ratio_paused = !collateral_ratio_paused;}
    function setOracleDollar(address _oracle) public onlyOwner {oracleDollar = _oracle;}
    function setOracleShare(address _oracle) public onlyOwner {oracleShare = _oracle;}
    function setOracleGovToken(address _oracle) public onlyOwner {oracleGovToken = _oracle;}
    function setStrategist(address _strategist) external onlyOwner {strategist = _strategist;}
    function setFoundry(address _foundry) public onlyOwner {foundry = _foundry;}
    function setEpochLength(uint256 _epoch_length) public onlyOwner {epoch_length = _epoch_length;}
    function setRebalanceCooldown(uint256 cooldown) public onlyOwner {rebalance_cooldown = cooldown;}
    function setExcessDistributionRatio(uint256 ratio) public onlyOwner {excess_collateral_distributed_ratio = ratio;}
    function updateOracles() public override withOracleUpdates {/*empty, used only for modifier*/}
        
    function installTokens(
        address _uniswap_router,
        address _governanceToken,
        address _wcoin,
        address _collateral,
        address _share,
        address _dollar
    ) public onlyOwner {
        uniswap_router  = _uniswap_router;
        governanceToken = _governanceToken;
        wcoin           = _wcoin;
        collateral      = _collateral;
        share           = _share;
        dollar          = _dollar;
    }

    function setRebalancePool(address _rebalance_pool) public onlyOwner  {
        require(pools[_rebalance_pool], "!pool");
        require(IPool(_rebalance_pool).getCollateralToken() != address(0), "!poolCollateralToken");
        rebalancing_pool = _rebalance_pool;
        rebalancing_pool_collateral = IPool(_rebalance_pool).getCollateralToken();
    }

    function resetStartTime(uint256 _startTime) external onlyOwner {
        require(_epoch == 0, "already started");
        startTime = _startTime;
        lastEpochTime = _startTime - 8 hours;
    }

    receive() external payable {}
}
