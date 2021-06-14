// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;
pragma experimental ABIEncoderV2;

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

library SafeERC20 {
  function safeTransfer(IERC20 token, address to, uint256 value) internal{
    require(token.transfer(to, value));
  }

  function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal{
    require(token.transferFrom(from, to, value));
  }

  function safeApprove( IERC20 token, address spender, uint256 value) internal{
    require(token.approve(spender, value));
  }
}

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

interface IOracle {
    function consult() external view returns (uint256);
}

interface IEpoch {
    function epoch() external view returns (uint256);

    function nextEpochPoint() external view returns (uint256);
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

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
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

abstract contract ERC20 is IERC20 {
    using SafeMath for uint256;
    
    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowed;
    uint256 private _totalSupply;

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address owner) public view override returns (uint256) {
        return _balances[owner];
    }

    function allowance(address owner, address spender) public view override returns (uint256){
        return _allowed[owner][spender];
    }

    function transfer(address to, uint256 value) public override returns (bool) {
        require(value <= _balances[msg.sender]);
        require(to != address(0));
        _balances[msg.sender] = _balances[msg.sender].sub(value);
        _balances[to] = _balances[to].add(value);
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public override returns (bool) {
        require(spender != address(0));
        _allowed[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public override returns (bool){
        require(value <= _balances[from]);
        require(value <= _allowed[from][msg.sender]);
        require(to != address(0));
        _balances[from] = _balances[from].sub(value);
        _balances[to] = _balances[to].add(value);
        _allowed[from][msg.sender] = _allowed[from][msg.sender].sub(value);
        emit Transfer(from, to, value);
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) public returns (bool){
        require(spender != address(0));
        _allowed[msg.sender][spender] = (
        _allowed[msg.sender][spender].add(addedValue));
        emit Approval(msg.sender, spender, _allowed[msg.sender][spender]);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool){
        require(spender != address(0));
        _allowed[msg.sender][spender] = (_allowed[msg.sender][spender].sub(subtractedValue));
        emit Approval(msg.sender, spender, _allowed[msg.sender][spender]);
        return true;
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0));
        _totalSupply = _totalSupply.add(amount);
        _balances[account] = _balances[account].add(amount);
        emit Transfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount) internal {
        require(account != address(0));
        require(amount <= _balances[account]);
        _totalSupply = _totalSupply.sub(amount);
        _balances[account] = _balances[account].sub(amount);
        emit Transfer(account, address(0), amount);
    }

    function _burnFrom(address account, uint256 amount) internal {
        require(amount <= _allowed[account][msg.sender]);
        _allowed[account][msg.sender] = _allowed[account][msg.sender].sub(amount);
        _burn(account, amount);
    }
}

contract ReentrancyGuard {
  uint256 private _guardCounter = 1;

  modifier nonReentrant() {
    _guardCounter += 1;
    uint256 localCounter = _guardCounter;
    _;
    require(localCounter == _guardCounter);
  }
}

contract ShareWrapper {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public share;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function stake(uint256 amount) public virtual {
        _totalSupply = _totalSupply.add(amount);
        _balances[msg.sender] = _balances[msg.sender].add(amount);
        IERC20(share).safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) public virtual {
        uint256 blacksmithShare = _balances[msg.sender];
        require(blacksmithShare >= amount, "Boardroom: withdraw request greater than staked amount");
        _totalSupply = _totalSupply.sub(amount);
        _balances[msg.sender] = blacksmithShare.sub(amount);
        IERC20(share).safeTransfer(msg.sender, amount);
    }
}

contract FoundryBTC is ShareWrapper, ReentrancyGuard, Operator {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    /* ========== DATA STRUCTURES ========== */

    struct FoundryPosition {
        uint256 lastSnapshotIndex;
        uint256 rewardEarned;
        uint256 epochTimerStart;
    }

    struct FoundrySnapshot {
        uint256 time;
        uint256 rewardReceived;
        uint256 rewardPerShare;
    }

    /* ========== STATE VARIABLES ========== */

    // flags
    bool public initialized = false;

    address public collateral;
    address public treasury;
    address public oracle; // oracle to get price of collateral

    mapping(address => FoundryPosition) public blacksmiths;
    FoundrySnapshot[] public foundryHistory;

    uint256 public withdrawLockupEpochs;

    /* ========== EVENTS ========== */

    event Initialized(address indexed executor, uint256 at);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardAdded(address indexed user, uint256 reward);

    /* ========== Modifiers =============== */
    modifier blacksmithExists {
        require(balanceOf(msg.sender) > 0, "Foundry: The blacksmith does not exist");
        _;
    }

    modifier updateReward(address blacksmith) {
        if (blacksmith != address(0)) {
            FoundryPosition memory position = blacksmiths[blacksmith];
            position.rewardEarned = earned(blacksmith);
            position.lastSnapshotIndex = latestSnapshotIndex();
            blacksmiths[blacksmith] = position;
        }
        _;
    }

    modifier notInitialized {
        require(!initialized, "Foundry: already initialized");
        _;
    }

    modifier onlyTreasury() {
        require(msg.sender == address(treasury), "!treasury");
        _;
    }

    /* ========== GOVERNANCE ========== */

    function initialize(address _collateral, address _share, address _treasury) public notInitialized {
        collateral = _collateral;
        share = _share;
        treasury = _treasury;

        FoundrySnapshot memory genesisSnapshot = FoundrySnapshot({time: block.number, rewardReceived: 0, rewardPerShare: 0});
        foundryHistory.push(genesisSnapshot);
        withdrawLockupEpochs = 8; // Lock for 8 epochs before release withdraw
        initialized = true;
        emit Initialized(msg.sender, block.number);
    }

    function setLockUp(uint256 _withdrawLockupEpochs) external onlyOperator {
        require(_withdrawLockupEpochs <= 56, "_withdrawLockupEpochs: out of range"); // <= 2 week
        withdrawLockupEpochs = _withdrawLockupEpochs;
    }

    function setOracle(address _oracle) external onlyOperator {
        oracle = _oracle;
    }

    /* ========== VIEW FUNCTIONS ========== */

    function info() public view returns (uint256,uint256,uint256,uint256, uint256,uint256){
        (uint256 _epoch, uint256 _nextEpochPoint, uint256 _epoch_length, uint256 _utilizationRatio) = ITreasury(treasury).epochInfo();
        return (
            _epoch, // current epoch
            _nextEpochPoint, // next epoch point
            _epoch_length, // epoch duration
            _utilizationRatio, // utilization ratio
            totalSupply(),
            IOracle(oracle).consult() // collateral price
        );
    }

    // =========== Snapshot getters

    function latestSnapshotIndex() public view returns (uint256) {
        return foundryHistory.length.sub(1);
    }

    function getLatestSnapshot() internal view returns (FoundrySnapshot memory) {
        return foundryHistory[latestSnapshotIndex()];
    }

    function getLastSnapshotIndexOf(address blacksmith) public view returns (uint256) {
        return blacksmiths[blacksmith].lastSnapshotIndex;
    }

    function getLastSnapshotOf(address blacksmith) internal view returns (FoundrySnapshot memory) {
        return foundryHistory[getLastSnapshotIndexOf(blacksmith)];
    }

    function canWithdraw(address blacksmith) external view returns (bool) {
        return blacksmiths[blacksmith].epochTimerStart.add(withdrawLockupEpochs) <= ITreasury(treasury).epoch();
    }

    function epoch() external view returns (uint256) {
        return ITreasury(treasury).epoch();
    }

    function nextEpochPoint() external view returns (uint256) {
        return ITreasury(treasury).nextEpochPoint();
    }

    // =========== blacksmith getters

    function rewardPerShare() public view returns (uint256) {
        return getLatestSnapshot().rewardPerShare;
    }

    function earned(address blacksmith) public view returns (uint256) {
        uint256 latestRPS = getLatestSnapshot().rewardPerShare;
        uint256 storedRPS = getLastSnapshotOf(blacksmith).rewardPerShare;

        return balanceOf(blacksmith).mul(latestRPS.sub(storedRPS)).div(1e18).add(blacksmiths[blacksmith].rewardEarned);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function stake(uint256 amount) public override nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Foundry: Cannot stake 0");
        super.stake(amount);
        blacksmiths[msg.sender].epochTimerStart = ITreasury(treasury).epoch(); // reset timer
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public override nonReentrant blacksmithExists updateReward(msg.sender) {
        require(amount > 0, "Foundry: Cannot withdraw 0");
        require(blacksmiths[msg.sender].epochTimerStart.add(withdrawLockupEpochs) <= ITreasury(treasury).epoch(), "Foundry: still in withdraw lockup");
        claimReward();
        super.withdraw(amount);
        emit Withdrawn(msg.sender, amount);
    }

    function exit() external {
        withdraw(balanceOf(msg.sender));
    }

    function claimReward() public updateReward(msg.sender) {
        uint256 reward = blacksmiths[msg.sender].rewardEarned;
        if (reward > 0) {
            blacksmiths[msg.sender].epochTimerStart = ITreasury(treasury).epoch(); // reset timer
            blacksmiths[msg.sender].rewardEarned = 0;
            IERC20(collateral).safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function allocateSeigniorage(uint256 amount) external nonReentrant onlyTreasury {
        require(amount > 0, "Foundry: Cannot allocate 0");
        require(totalSupply() > 0, "Foundry: Cannot allocate when totalSupply is 0");

        // Create & add new snapshot
        uint256 prevRPS = getLatestSnapshot().rewardPerShare;
        uint256 nextRPS = prevRPS.add(amount.mul(1e18).div(totalSupply()));

        FoundrySnapshot memory newSnapshot = FoundrySnapshot({time: block.number, rewardReceived: amount, rewardPerShare: nextRPS});
        foundryHistory.push(newSnapshot);

        IERC20(collateral).safeTransferFrom(msg.sender, address(this), amount);
        emit RewardAdded(msg.sender, amount);
    }
}
