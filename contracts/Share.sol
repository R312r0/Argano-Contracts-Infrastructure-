// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "./interfaces/ITreasury.sol";


contract Share is ERC20Capped, Ownable {
    address public treasury;
    bool private genesisSupplyMinted = false;
    uint256 public genesisSupply;

    address public rewardController; // Holding SHARE tokens to distribute into Liquiditiy Mining Pools
    uint256 public communityRewardAllocation;
    uint256 public communityRewardClaimed;

    modifier onlyPools() {
        require( ITreasury( treasury ).hasPool( _msgSender() ), "!pools" );
        _;
    }

    event ShareBurned(address indexed from, address indexed to, uint256 amount);// Track Share burned
    event ShareMinted(address indexed from, address indexed to, uint256 amount);// Track Share minted
    event NewTreasuryAddress(address treasury);// Track treasury address changes
    event CommunityRewardsClaimed(address controller, uint256 amount);

    constructor(
        string memory _name, 
        string memory _symbol, 
        uint256 _hardCap,
        uint256 _genesisSupply,
        uint256 _communityRewardAllocation,
        address _treasury,
        address _rewardController
    )
        ERC20(_name, _symbol)
        ERC20Capped(_hardCap)
    {
        require(_rewardController != address(0), "badRewardController");
        rewardController = _rewardController;
        setTreasuryAddress(_treasury);
        communityRewardAllocation = _communityRewardAllocation;
        genesisSupply = _genesisSupply;
    }
    
    function mintGenesisSupply() external onlyOwner {
        require(!genesisSupplyMinted, "genesisSupplyAlreadyMinted");
        genesisSupplyMinted = true;
        _mint(msg.sender, genesisSupply);// mint 1 time requiered amount for allocation
        emit ShareMinted(address(this), msg.sender, genesisSupply);
    }


    function claimCommunityRewards(uint256 amount) external onlyOwner {
        require(amount > 0, "invalidAmount");
        require(amount <= ( communityRewardAllocation - communityRewardClaimed) , "exceedRewards");
        communityRewardClaimed = communityRewardClaimed + amount;
        _mint(rewardController, amount);
        emit CommunityRewardsClaimed(rewardController, amount);
    }


    function setTreasuryAddress(address _treasury) public onlyOwner {
        require(_treasury != address(0), "badTreasury");
        treasury = _treasury;
        emit NewTreasuryAddress(treasury);
    }

    // This function is what other Pools will call to mint new SHARE
    function poolMint(address m_address, uint256 m_amount) external onlyPools {
        _mint(m_address, m_amount);
        emit ShareMinted(address(this), m_address, m_amount);
    }

    // This function is what other pools will call to burn SHARE
    function poolBurnFrom(address b_address, uint256 b_amount) external onlyPools {
        _burn(b_address, b_amount);
        emit ShareBurned(b_address, address(this), b_amount);
    }
}
