// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

// import "./openZeppelin/SafeMath.sol";
// import "./openZeppelin/Context.sol";

import "./ERC20Custom.sol";
import "./Operator.sol";
import "./CNUSD.sol";
import "./interfaces/ITreasury.sol";
import "./interfaces/IDollar.sol";

contract AGOBTC is ERC20Custom, IDollar, Operator {
    using SafeMath for uint256;

    // ERC20
    string public override symbol;
    string public override name;
    uint8 public constant override decimals = 18;
    uint256 public constant genesis_supply = 5000 ether; // 5000 will be mited at genesis for liq pool seeding

    // CONTRACTS
    address public treasury;

    // FLAGS
    bool public initialized;

    /* ========== MODIFIERS ========== */

    modifier onlyPools() {
        require(ITreasury(treasury).hasPool(msg.sender), "!pools");
        _;
    }

    /* ========== CONSTRUCTOR ========== */

    constructor(string memory _name,  string memory _symbol, address _treasury){
        name = _name;
        symbol = _symbol;
        treasury = _treasury;
    }

    function initialize() external onlyOperator {
        require(!initialized, "alreadyInitialized");
        initialized = true;
        _mint(_msgSender(), genesis_supply);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    // Burn DOLLAR. Can be used by Pool only
    function poolBurnFrom(address _address, uint256 _amount) external override onlyPools {
        super._burnFrom(_address, _amount);
        emit DollarBurned(_address, msg.sender, _amount);
    }

    // Mint DOLLAR. Can be used by Pool only
    function poolMint(address _address, uint256 _amount) external override onlyPools {
        super._mint(_address, _amount);
        emit DollarMinted(msg.sender, _address, _amount);
    }

    function setTreasuryAddress(address _treasury) public onlyOperator {
        treasury = _treasury;
    }

    /* ========== EVENTS ========== */
    event DollarBurned(address indexed from, address indexed to, uint256 amount);// Track DOLLAR burned
    event DollarMinted(address indexed from, address indexed to, uint256 amount);// Track DOLLAR minted
}
