// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "./openZeppelin/SafeMath.sol";
import "./openZeppelin/Context.sol";
import "./openZeppelin/IERC20.sol";

import "./ERC20Custom.sol";
import "./interfaces/ITreasury.sol";
import "./Operator.sol";

contract CNUSD is ERC20Custom, Operator {
    using SafeMath for uint256;

    /* ========== STATE VARIABLES ========== */

    // ERC20 - Token
    string public override symbol;
    string public override name;
    uint8 public constant override decimals = 18;

    // CONTRACTS
    address public treasury;

    // FLAGS
    bool public initialized;

    // DISTRIBUTION
    uint256 public constant COMMUNITY_REWARD_ALLOCATION = 80000000 ether; // 80M
    uint256 public constant DEV_FUND_ALLOCATION = 20000000 ether; // 20M
    uint256 public constant VESTING_DURATION = 1 days;//365 days; // 12 months
    uint256 public startTime; // Start time of vesting duration
    uint256 public endTime; // End of vesting duration
    address public devFund;
    address public rewardController; // Holding SHARE tokens to distribute into Liquiditiy Mining Pools
    uint256 public devFundLastClaimed;
    uint256 public devFundEmissionRate = DEV_FUND_ALLOCATION / VESTING_DURATION;
    uint256 public communityRewardClaimed;

    /* ========== MODIFIERS ========== */

    modifier onlyPools() {
        require(ITreasury(treasury).hasPool(msg.sender), "!pools");
        _;
    }

    /* ========== CONSTRUCTOR ========== */

    constructor(string memory _name, string memory _symbol,  address _treasury){
        name = _name;
        symbol = _symbol;
        treasury = _treasury;
    }

    function initialize(
        address _devFund,
        address _rewardController,
        uint256 _startTime
    ) external onlyOperator {
        require(!initialized, "alreadyInitialized");
        require(_rewardController != address(0), "!rewardController");
        initialized = true;
        devFund = _devFund;
        rewardController = _rewardController;
        startTime = _startTime;
        endTime = _startTime + VESTING_DURATION;
        devFundLastClaimed = _startTime;

        _mint(msg.sender, 5000 ether);
    }

    function claimCommunityRewards(uint256 amount) external onlyOperator {
        require(amount > 0, "invalidAmount");
        require(initialized, "!initialized");
        require(rewardController != address(0), "!rewardController");
        uint256 _remainingRewards = COMMUNITY_REWARD_ALLOCATION.sub(communityRewardClaimed);
        require(amount <= _remainingRewards, "exceedRewards");
        communityRewardClaimed = communityRewardClaimed.add(amount);
        _mint(rewardController, amount);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function setTreasuryAddress(address _treasury) external onlyOperator {
        treasury = _treasury;
    }

    function setDevFund(address _devFund) external {
        require(msg.sender == devFund, "!dev");
        require(_devFund != address(0), "zero");
        devFund = _devFund;
    }

    // This function is what other Pools will call to mint new SHARE
    function poolMint(address m_address, uint256 m_amount) external onlyPools {
        super._mint(m_address, m_amount);
        emit ShareMinted(address(this), m_address, m_amount);
    }

    // This function is what other pools will call to burn SHARE
    function poolBurnFrom(address b_address, uint256 b_amount) external onlyPools {
        super._burnFrom(b_address, b_amount);
        emit ShareBurned(b_address, address(this), b_amount);
    }

    function unclaimedDevFund() public view returns (uint256 _pending) {
        uint256 _now = block.timestamp;
        if (_now > endTime) _now = endTime;
        if (devFundLastClaimed >= _now) return 0;
        _pending = _now.sub(devFundLastClaimed).mul(devFundEmissionRate);
    }

    function claimDevFundRewards() external {
        require(msg.sender == devFund, "!dev");
        uint256 _pending = unclaimedDevFund();
        if (_pending > 0 && devFund != address(0)) {
            _mint(devFund, _pending);
            devFundLastClaimed = block.timestamp;
        }
    }

    /* ========== EVENTS ========== */

    // Track Share burned
    event ShareBurned(address indexed from, address indexed to, uint256 amount);

    // Track Share minted
    event ShareMinted(address indexed from, address indexed to, uint256 amount);
}
