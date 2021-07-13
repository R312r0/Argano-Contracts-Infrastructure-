// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "./interfaces/IEpoch.sol";
import "./interfaces/ITreasury.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./utilityContracts/ERC20Custom.sol";

contract Share is ERC20Custom, Ownable {
    string public  symbol;
    string public  name;
    uint8 public constant  decimals = 18;

    address public treasury;

    bool public initialized;

    uint256 public constant COMMUNITY_REWARD_ALLOCATION = 80000000 ether; // 80M
    address public rewardController; // Holding SHARE tokens to distribute into Liquiditiy Mining Pools
    uint256 public communityRewardClaimed;

    modifier onlyPools() {
        require(ITreasury(treasury).hasPool(msg.sender), "!pools");
        _;
    }

    event ShareBurned(address indexed from, address indexed to, uint256 amount);// Track Share burned
    event ShareMinted(address indexed from, address indexed to, uint256 amount);// Track Share minted

    constructor(string memory _name, string memory _symbol,  address _treasury){
        name = _name;
        symbol = _symbol;
        treasury = _treasury;
    }

    function initialize( address _rewardController) external onlyOwner {
        require(!initialized, "alreadyInitialized");
        require(_rewardController != address(0), "!rewardController");
        initialized = true;
        rewardController = _rewardController;

        _mint(msg.sender, 5000 ether);
    }

    function claimCommunityRewards(uint256 amount) external onlyOwner {
        require(amount > 0, "invalidAmount");
        require(initialized, "!initialized");
        require(rewardController != address(0), "!rewardController");
        uint256 _remainingRewards = COMMUNITY_REWARD_ALLOCATION - communityRewardClaimed;
        require(amount <= _remainingRewards, "exceedRewards");
        communityRewardClaimed = communityRewardClaimed + amount;
        _mint(rewardController, amount);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */
    function setTreasuryAddress(address _treasury) external onlyOwner {
        require(_treasury != address(0), 'Zero address passed');
        treasury = _treasury;
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
}
