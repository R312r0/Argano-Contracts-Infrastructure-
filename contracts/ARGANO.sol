//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./interfaces/IERC20.sol";
import "./libraries/SafeMath.sol";
import "./utilityContracts/Context.sol";
import "./utilityContracts/ERC20.sol";
import "./libraries/Address.sol";
import "./libraries/SafeERC20.sol";
import "./utilityContracts/Ownable.sol";
import "./utilityContracts/ERC20Detailed.sol";

contract ARGANO is ERC20, ERC20Detailed, Ownable {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    constructor() ERC20Detailed("Argano", "AGO", 18) {
        _totalSupply = 65000000 * (10**uint256(18));
        _balances[msg.sender] = _totalSupply;
    }
}
