// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./interfaces/IPool.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/ITreasury.sol";
import "./interfaces/IDollar.sol";
import "./interfaces/IShare.sol";

contract Pool is Ownable, ReentrancyGuard, IPool {
    using SafeERC20 for ERC20;

    address public dollar;
    address public share;
    address public collateral;
    address public governanceToken;
    address public treasury;
    address public oracle; // oracle to get price of collateral

    mapping(address => uint256) public redeem_share_balances;
    mapping(address => uint256) public redeem_collateral_balances;

    uint256 public unclaimed_pool_collateral;
    uint256 public unclaimed_pool_share;

    mapping(address => uint256) public last_redeemed;

    // Constants for various precisions
    uint256 private constant PRICE_PRECISION = 1e6;
    uint256 private constant COLLATERAL_RATIO_PRECISION = 1e6;
    uint256 private constant COLLATERAL_RATIO_MAX = 1e6;

    // Number of decimals needed to get to 18
    uint256 private missing_decimals;

    // Pool_ceiling is the total units of collateral that a pool contract can hold
    uint256 public pool_ceiling = 0;

    // Number of blocks to wait before being able to collectRedemption()
    uint256 public collect_redemption_delay = 1;

    // Number of blocks to wait before being able to redem()
    uint256 public redemption_delay = 30;//~1 min, when block time is around 2 sec

    // AccessControl state variables
    bool public mint_paused = false;
    bool public redeem_paused = false;
    bool public migrated = false;

    /* ========== MODIFIERS ========== */
    

    modifier notMigrated() {
        require(!migrated, "migrated");
        _;
    }

    modifier onlyTreasury() {
        require(msg.sender == treasury, "!treasury");
        _;
    }
    
    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _dollar,
        address _share,
        address _collateral,
        address _governanceToken,
        address _treasury,
        uint256 _pool_ceiling
    ){
        require(_dollar             != address(0), "!_dollar");
        require(_share              != address(0), "!_share");
        require(_collateral         != address(0), "!_collateral");
        require(_governanceToken    != address(0), "!_governanceToken");
        require(_treasury           != address(0), "!_treasury");

        dollar = _dollar;
        share = _share;
        collateral = _collateral;
        governanceToken = _governanceToken;
        treasury = _treasury;
        pool_ceiling = _pool_ceiling;
        missing_decimals = uint256(18) - IERC20Metadata(_collateral).decimals();//only tokens with 18 decimals or less is desired
    }

    /* ========== VIEWS ========== */

    // Returns dollar value of collateral held in this pool
    function collateralDollarBalance() external view override returns (uint256) {
        uint256 collateral_usd_price = getCollateralPrice();
        return (ERC20(collateral).balanceOf(address(this)) - unclaimed_pool_collateral) * 10**missing_decimals * collateral_usd_price / PRICE_PRECISION;
    }

    function info()
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            bool,
            bool
        )
    {
        return (
            pool_ceiling, // Ceiling of pool - collateral-amount
            ERC20(collateral).balanceOf(address(this)), // amount of COLLATERAL locked in this contract
            unclaimed_pool_collateral, // unclaimed amount of COLLATERAL
            unclaimed_pool_share, // unclaimed amount of SHARE
            getCollateralPrice(), // collateral price
            mint_paused,
            redeem_paused
        );
    }

    /* ========== PUBLIC FUNCTIONS ========== */

    function getCollateralPrice() public view override returns (uint256) {
        return IOracle(oracle).consult();
    }

    function getCollateralToken() external view override returns (address) {
        return collateral;
    }
    
    function getMissing_decimals() external view override returns (uint256) {
        return missing_decimals;
    }

    function mint(
        uint256 _collateral_amount,
        uint256 _share_amount,
        uint256 _dollar_out_min
    ) external notMigrated {
        require(mint_paused == false, "Minting is paused");
        ITreasury(treasury).updateOracles();
        (, uint256 _share_price, uint256 _target_collateral_ratio, , , uint256 _minting_fee, ) = ITreasury(treasury).info(msg.sender);
        require(ERC20(collateral).balanceOf(address(this)) - unclaimed_pool_collateral + _collateral_amount <= pool_ceiling, ">poolCeiling");
        uint256 _price_collateral = getCollateralPrice();
        uint256 _total_dollar_value = 0;
        uint256 _required_share_amount = 0;
        if (_target_collateral_ratio > 0) {
            uint256 _collateral_value = (_collateral_amount * 10**missing_decimals) * _price_collateral / PRICE_PRECISION;
            _total_dollar_value = _collateral_value * (COLLATERAL_RATIO_PRECISION) / (_target_collateral_ratio);
            if (_target_collateral_ratio < COLLATERAL_RATIO_MAX) {
                _required_share_amount = (_total_dollar_value - _collateral_value) * PRICE_PRECISION / _share_price;
            }
        } else {
            _total_dollar_value = _share_amount * _share_price / PRICE_PRECISION;
            _required_share_amount = _share_amount;
        }
        uint256 _actual_dollar_amount = _total_dollar_value - ((_total_dollar_value * _minting_fee) / PRICE_PRECISION);
        require(_dollar_out_min <= _actual_dollar_amount, ">slippage");

        if (_required_share_amount > 0) {
            require(_required_share_amount <= _share_amount, "<shareBalance");
            IShare(share).poolBurnFrom(msg.sender, _required_share_amount);
        }
        if (_collateral_amount > 0) {
            ERC20(collateral).transferFrom(msg.sender, address(this), _collateral_amount);
        }
        IDollar(dollar).poolMint(msg.sender, _actual_dollar_amount);
    }

    function redeem(
        uint256 _dollar_amount,
        uint256 _share_out_min,
        uint256 _collateral_out_min
    ) external notMigrated {
        require(redeem_paused == false, "Redeeming is paused");
        require((last_redeemed[msg.sender] + (redemption_delay)) <= block.number, "<redemption_delay");
        ITreasury(treasury).updateOracles();
        (, uint256 _share_price, , uint256 _effective_collateral_ratio, , , uint256 _redemption_fee) = ITreasury(treasury).info(msg.sender);
        uint256 _collateral_price = getCollateralPrice();
        uint256 _dollar_amount_post_fee = _dollar_amount - (_dollar_amount * _redemption_fee / PRICE_PRECISION);
        uint256 _collateral_output_amount = 0;
        uint256 _share_output_amount = 0;

        if (_effective_collateral_ratio < COLLATERAL_RATIO_MAX) {
            uint256 _share_output_value = _dollar_amount_post_fee - (_dollar_amount_post_fee * _effective_collateral_ratio / PRICE_PRECISION);
            _share_output_amount = _share_output_value * PRICE_PRECISION / _share_price;
        }

        if (_effective_collateral_ratio > 0) {
            uint256 _collateral_output_value = _dollar_amount_post_fee / (10**missing_decimals) * _effective_collateral_ratio / PRICE_PRECISION;
            _collateral_output_amount = _collateral_output_value * PRICE_PRECISION / _collateral_price;
        }

        // Check if collateral balance meets and meet output expectation
        require(_collateral_output_amount <= ERC20(collateral).balanceOf(address(this)) - unclaimed_pool_collateral, "<collateralBlanace");
        require(_collateral_out_min <= _collateral_output_amount && _share_out_min <= _share_output_amount, ">slippage");

        if (_collateral_output_amount > 0) {
            redeem_collateral_balances[msg.sender] = redeem_collateral_balances[msg.sender] + _collateral_output_amount;
            unclaimed_pool_collateral = unclaimed_pool_collateral + _collateral_output_amount;
        }

        if (_share_output_amount > 0) {
            redeem_share_balances[msg.sender] = redeem_share_balances[msg.sender] + _share_output_amount;
            unclaimed_pool_share = unclaimed_pool_share + _share_output_amount;
        }

        last_redeemed[msg.sender] = block.number;

        // Move all external functions to the end
        IDollar(dollar).poolBurnFrom(msg.sender, _dollar_amount);
        if (_share_output_amount > 0) {
            IShare(share).poolMint(address(this), _share_output_amount);
        }
    }

    function collectRedemption() external {
        // Redeem and Collect cannot happen in the same transaction to avoid flash loan attack
        require((last_redeemed[msg.sender] + collect_redemption_delay) <= block.number, "<collect_redemption_delay");

        ITreasury(treasury).updateOracles();
        
        bool _send_share = false;
        bool _send_collateral = false;
        uint256 _share_amount;
        uint256 _collateral_amount;

        // Use Checks-Effects-Interactions pattern
        if (redeem_share_balances[msg.sender] > 0) {
            _share_amount = redeem_share_balances[msg.sender];
            redeem_share_balances[msg.sender] = 0;
            unclaimed_pool_share = unclaimed_pool_share - _share_amount;
            _send_share = true;
        }

        if (redeem_collateral_balances[msg.sender] > 0) {
            _collateral_amount = redeem_collateral_balances[msg.sender];
            redeem_collateral_balances[msg.sender] = 0;
            unclaimed_pool_collateral = unclaimed_pool_collateral - _collateral_amount;
            _send_collateral = true;
        }

        if (_send_share) {
            ERC20(share).transfer(msg.sender, _share_amount);
        }

        if (_send_collateral) {
            ERC20(collateral).transfer(msg.sender, _collateral_amount);
        }
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    // move collateral to new pool address
    function migrate(address _new_pool) external override nonReentrant onlyOwner notMigrated {
        migrated = true;
        uint256 availableCollateral = ERC20(collateral).balanceOf(address(this)) - unclaimed_pool_collateral;
        ERC20(collateral).safeTransfer(_new_pool, availableCollateral);
    }

    function toggleMinting() external onlyOwner {
        mint_paused = !mint_paused;
    }

    function toggleRedeeming() external onlyOwner {
        redeem_paused = !redeem_paused;
    }

    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }

    function setPoolCeiling(uint256 _pool_ceiling) external onlyOwner {
        pool_ceiling = _pool_ceiling;
    }

    function setCollectRedemptionDelay(uint256 _collect_redemption_delay) external onlyOwner {
        collect_redemption_delay = _collect_redemption_delay;
    }

    function setRedemptionDelay(uint256 _redemption_delay) external onlyOwner {
        redemption_delay = _redemption_delay;
    }

    function setTreasury(address _treasury) external onlyOwner {
        emit TreasuryTransferred(treasury, _treasury);
        treasury = _treasury;
    }

    // Transfer collateral to Treasury to execute strategies
    function transferCollateralToTreasury(uint256 amount) external override onlyTreasury {
        require(amount > 0, "zeroAmount");
        require(treasury != address(0), "invalidTreasury");
        ERC20(collateral).safeTransfer(treasury, amount);
    }

    // EVENTS
    event TreasuryTransferred(address indexed previousTreasury, address indexed newTreasury);
}
