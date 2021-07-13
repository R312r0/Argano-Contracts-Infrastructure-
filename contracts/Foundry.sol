// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/IEpoch.sol";
import "./interfaces/ITreasury.sol";
import "./utilityContracts/ShareWrapper.sol";


contract Foundry is ShareWrapper, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using Address for address;

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

    function setLockUp(uint256 _withdrawLockupEpochs) external onlyOwner {
        require(_withdrawLockupEpochs <= 56, "_withdrawLockupEpochs: out of range"); // <= 2 week
        withdrawLockupEpochs = _withdrawLockupEpochs;
    }

    function setOracle(address _oracle) external onlyOwner {
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
        return foundryHistory.length - (1);
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
        return blacksmiths[blacksmith].epochTimerStart + (withdrawLockupEpochs) <= ITreasury(treasury).epoch();
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

        return balanceOf(blacksmith) * (latestRPS - (storedRPS)) / (1e18) + (blacksmiths[blacksmith].rewardEarned);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function stake(uint256 amount) public override nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Foundry: Cannot stake 0");
        super.stake(amount);
        blacksmiths[msg.sender].epochTimerStart = ITreasury(treasury).epoch(); // reset timer
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public override nonReentrant updateReward(msg.sender) {
        require(balanceOf(msg.sender) > 0, "Foundry: The blacksmith does not exist");
        require(amount > 0, "Foundry: Cannot withdraw 0");
        require(blacksmiths[msg.sender].epochTimerStart + (withdrawLockupEpochs) <= ITreasury(treasury).epoch(), "Foundry: still in withdraw lockup");
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
        uint256 nextRPS = prevRPS + (amount * (1e18) / totalSupply());

        FoundrySnapshot memory newSnapshot = FoundrySnapshot({time: block.number, rewardReceived: amount, rewardPerShare: nextRPS});
        foundryHistory.push(newSnapshot);

        IERC20(collateral).safeTransferFrom(msg.sender, address(this), amount);
        emit RewardAdded(msg.sender, amount);
    }
}
