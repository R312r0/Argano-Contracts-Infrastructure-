//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    function sub( uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;
        return c;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {return 0;}
        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");
        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b > 0, errorMessage);
        uint256 c = a / b;
        return c;
    }
}



interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value); 
}



contract Context {
    constructor() {}
    // solhint-disable-previous-line no-empty-blocks

    function _msgSender() internal view returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        this;
        return msg.data;
    }
}


interface IEpoch {
    function epoch() external view returns (uint256);
    function nextEpochPoint() external view returns (uint256);
}




library Address {
    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(account) }
        return size > 0;
    }

    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");
        (bool success, ) = recipient.call{ value: amount }("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }

    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
      return functionCall(target, data, "Address: low-level call failed");
    }

    function functionCall(address target, bytes memory data, string memory errorMessage) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, errorMessage);
    }

    function functionCallWithValue(address target, bytes memory data, uint256 value) internal returns (bytes memory) {
        return functionCallWithValue(target, data, value, "Address: low-level call with value failed");
    }

    function functionCallWithValue(address target, bytes memory data, uint256 value, string memory errorMessage) internal returns (bytes memory) {
        require(address(this).balance >= value, "Address: insufficient balance for call");
        require(isContract(target), "Address: call to non-contract");
        (bool success, bytes memory returndata) = target.call{ value: value }(data);
        return _verifyCallResult(success, returndata, errorMessage);
    }

    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
        return functionStaticCall(target, data, "Address: low-level static call failed");
    }

    function functionStaticCall(address target, bytes memory data, string memory errorMessage) internal view returns (bytes memory) {
        require(isContract(target), "Address: static call to non-contract");
        (bool success, bytes memory returndata) = target.staticcall(data);
        return _verifyCallResult(success, returndata, errorMessage);
    }

    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionDelegateCall(target, data, "Address: low-level delegate call failed");
    }

    function functionDelegateCall(address target, bytes memory data, string memory errorMessage) internal returns (bytes memory) {
        require(isContract(target), "Address: delegate call to non-contract");
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return _verifyCallResult(success, returndata, errorMessage);
    }

    function _verifyCallResult(bool success, bytes memory returndata, string memory errorMessage) private pure returns(bytes memory) {
        if (success) {
            return returndata;
        } else {
            if (returndata.length > 0) {
                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert(errorMessage);
            }
        }
    }
}


pragma experimental ABIEncoderV2;

contract ReentrancyGuard {
  uint256 private _guardCounter = 1;

  modifier nonReentrant() {
    _guardCounter += 1;
    uint256 localCounter = _guardCounter;
    _;
    require(localCounter == _guardCounter);
  }
}



contract Ownable {
    address public owner;

    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        if (newOwner != address(0)) {
            owner = newOwner;
        }
    }
}





interface IShare {
    function poolBurnFrom(address _address, uint256 _amount) external;

    function poolMint(address _address, uint256 m_amount) external;
}





interface IDollar {
    function poolBurnFrom(address _address, uint256 _amount) external;
    function poolMint(address _address, uint256 m_amount) external;
}





interface IOracle {
    function consult() external view returns (uint256);
}





interface IPool {
    function collateralDollarBalance() external view returns (uint256);

    function migrate(address _new_pool) external;

    function transferCollateralToTreasury(uint256 amount) external;

    function getCollateralPrice() external view returns (uint256);

    function getCollateralToken() external view returns (address);
}












library SafeERC20 {
    using SafeMath for uint256;
    using Address for address;

    function safeTransfer(IERC20 token,address to, uint256 value) internal {
        callOptionalReturn(
            token,
            abi.encodeWithSelector(token.transfer.selector, to, value)
        );
    }

    function safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value
    ) internal {
        callOptionalReturn(
            token,
            abi.encodeWithSelector(token.transferFrom.selector, from, to, value)
        );
    }

    function safeApprove(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        require(
            (value == 0) || (token.allowance(address(this), spender) == 0),
            "SafeERC20: approve from non-zero to non-zero allowance"
        );
        callOptionalReturn(
            token,
            abi.encodeWithSelector(token.approve.selector, spender, value)
        );
    }

    function callOptionalReturn(IERC20 token, bytes memory data) private {
        require(address(token).isContract(), "SafeERC20: call to non-contract");

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returndata) = address(token).call(data);
        require(success, "SafeERC20: low-level call failed");

        if (returndata.length > 0) {
            // Return data is optional
            // solhint-disable-next-line max-line-length
            require(
                abi.decode(returndata, (bool)),
                "SafeERC20: ERC20 operation did not succeed"
            );
        }
    }
}










interface ITreasury is IEpoch {
    function hasPool(address _address) external view returns (bool);

    function info()
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256
        );

    function epochInfo()
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        );
}











contract ERC20 is Context, IERC20 {
    using SafeMath for uint256;

    mapping(address => uint256) internal _balances;
    mapping(address => mapping(address => uint256)) internal _allowances;
    uint256 internal _totalSupply;

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount)public override returns (bool) {
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    function allowance(address owner, address spender)public view override returns (uint256){
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool){
        _approve(_msgSender(), spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(
            sender,
            _msgSender(),
            _allowances[sender][_msgSender()].sub(
                amount,
                "ERC20: transfer amount exceeds allowance"
            )
        );
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) public returns (bool){
        _approve(
            _msgSender(),
            spender,
            _allowances[_msgSender()][spender].add(addedValue)
        );
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue)public returns (bool){
        _approve(
            _msgSender(),
            spender,
            _allowances[_msgSender()][spender].sub(
                subtractedValue,
                "ERC20: decreased allowance below zero"
            )
        );
        return true;
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        _balances[sender] = _balances[sender].sub(amount, "ERC20: transfer amount exceeds balance");
        _balances[recipient] = _balances[recipient].add(amount);

        emit Transfer(sender, recipient, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: burn from the zero address");

        _balances[account] = _balances[account].sub(amount, "ERC20: burn amount exceeds balance");
        _totalSupply = _totalSupply.sub(amount);

        emit Transfer(account, address(0), amount);
    }
}






contract ERC20Detailed is ERC20 {
    string private _name;
    string private _symbol;
    uint8 private _decimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) {
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }
}





contract Pool is Ownable, ReentrancyGuard, IPool {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    /* ========== STATE VARIABLES ========== */

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
        dollar = _dollar;
        share = _share;
        collateral = _collateral;
        governanceToken = _governanceToken;
        treasury = _treasury;
        pool_ceiling = _pool_ceiling;
        missing_decimals = uint256(18).sub(ERC20Detailed(_collateral).decimals());
    }

    /* ========== VIEWS ========== */

    // Returns dollar value of collateral held in this pool
    function collateralDollarBalance() external view override returns (uint256) {
        uint256 collateral_usd_price = getCollateralPrice();
        return (ERC20(collateral).balanceOf(address(this)).sub(unclaimed_pool_collateral)).mul(10**missing_decimals).mul(collateral_usd_price).div(PRICE_PRECISION);
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

    function mint(
        uint256 _collateral_amount,
        uint256 _share_amount,
        uint256 _dollar_out_min
    ) external notMigrated {
        require(mint_paused == false, "Minting is paused");
        (, uint256 _share_price, , uint256 _target_collateral_ratio, , , uint256 _minting_fee, ) = ITreasury(treasury).info();
        require(ERC20(collateral).balanceOf(address(this)).sub(unclaimed_pool_collateral).add(_collateral_amount) <= pool_ceiling, ">poolCeiling");
        uint256 _price_collateral = getCollateralPrice();
        uint256 _total_dollar_value = 0;
        uint256 _required_share_amount = 0;
        if (_target_collateral_ratio > 0) {
            uint256 _collateral_value = (_collateral_amount * (10**missing_decimals)).mul(_price_collateral).div(PRICE_PRECISION);
            _total_dollar_value = _collateral_value.mul(COLLATERAL_RATIO_PRECISION).div(_target_collateral_ratio);
            if (_target_collateral_ratio < COLLATERAL_RATIO_MAX) {
                _required_share_amount = _total_dollar_value.sub(_collateral_value).mul(PRICE_PRECISION).div(_share_price);
            }
        } else {
            _total_dollar_value = _share_amount.mul(_share_price).div(PRICE_PRECISION);
            _required_share_amount = _share_amount;
        }
        uint256 _actual_dollar_amount = _total_dollar_value.sub((_total_dollar_value.mul(_minting_fee)).div(PRICE_PRECISION));
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
        require((last_redeemed[msg.sender].add(redemption_delay)) <= block.number, "<redemption_delay");
        (, uint256 _share_price, , , uint256 _effective_collateral_ratio, , , uint256 _redemption_fee) = ITreasury(treasury).info();
        uint256 _collateral_price = getCollateralPrice();
        uint256 _dollar_amount_post_fee = _dollar_amount.sub((_dollar_amount.mul(_redemption_fee)).div(PRICE_PRECISION));
        uint256 _collateral_output_amount = 0;
        uint256 _share_output_amount = 0;

        if (_effective_collateral_ratio < COLLATERAL_RATIO_MAX) {
            uint256 _share_output_value = _dollar_amount_post_fee.sub(_dollar_amount_post_fee.mul(_effective_collateral_ratio).div(PRICE_PRECISION));
            _share_output_amount = _share_output_value.mul(PRICE_PRECISION).div(_share_price);
        }

        if (_effective_collateral_ratio > 0) {
            uint256 _collateral_output_value = _dollar_amount_post_fee.div(10**missing_decimals).mul(_effective_collateral_ratio).div(PRICE_PRECISION);
            _collateral_output_amount = _collateral_output_value.mul(PRICE_PRECISION).div(_collateral_price);
        }

        // Check if collateral balance meets and meet output expectation
        require(_collateral_output_amount <= ERC20(collateral).balanceOf(address(this)).sub(unclaimed_pool_collateral), "<collateralBlanace");
        require(_collateral_out_min <= _collateral_output_amount && _share_out_min <= _share_output_amount, ">slippage");

        if (_collateral_output_amount > 0) {
            redeem_collateral_balances[msg.sender] = redeem_collateral_balances[msg.sender].add(_collateral_output_amount);
            unclaimed_pool_collateral = unclaimed_pool_collateral.add(_collateral_output_amount);
        }

        if (_share_output_amount > 0) {
            redeem_share_balances[msg.sender] = redeem_share_balances[msg.sender].add(_share_output_amount);
            unclaimed_pool_share = unclaimed_pool_share.add(_share_output_amount);
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
        require((last_redeemed[msg.sender].add(collect_redemption_delay)) <= block.number, "<collect_redemption_delay");

        bool _send_share = false;
        bool _send_collateral = false;
        uint256 _share_amount;
        uint256 _collateral_amount;

        // Use Checks-Effects-Interactions pattern
        if (redeem_share_balances[msg.sender] > 0) {
            _share_amount = redeem_share_balances[msg.sender];
            redeem_share_balances[msg.sender] = 0;
            unclaimed_pool_share = unclaimed_pool_share.sub(_share_amount);
            _send_share = true;
        }

        if (redeem_collateral_balances[msg.sender] > 0) {
            _collateral_amount = redeem_collateral_balances[msg.sender];
            redeem_collateral_balances[msg.sender] = 0;
            unclaimed_pool_collateral = unclaimed_pool_collateral.sub(_collateral_amount);
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
        uint256 availableCollateral = ERC20(collateral).balanceOf(address(this)).sub(unclaimed_pool_collateral);
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



