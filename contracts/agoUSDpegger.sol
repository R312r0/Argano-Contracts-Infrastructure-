//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.4;

abstract contract Context {
    function _msgSender() internal view virtual returns (address payable) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes memory) {
        this;
        return msg.data;
    }
}

contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor () internal {
        address msgSender = _msgSender();
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }

    function owner() public view returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(_owner == _msgSender(), "Ownable: caller is not the owner");
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

library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }

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
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}

library Address {

    function isContract(address account) internal view returns (bool) {
        uint256 size;
        // solhint-disable-next-line no-inline-assembly
        assembly { size := extcodesize(account) }
        return size > 0;
    }

    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");

        // solhint-disable-next-line avoid-low-level-calls, avoid-call-value
        (bool success, ) = recipient.call{ value: amount }("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }

    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
      return functionCall(target, data, "Address: low-level call failed");
    }

    function functionCall(address target, bytes memory data, string memory errorMessage) internal returns (bytes memory) {
        return _functionCallWithValue(target, data, 0, errorMessage);
    }

    function functionCallWithValue(address target, bytes memory data, uint256 value) internal returns (bytes memory) {
        return functionCallWithValue(target, data, value, "Address: low-level call with value failed");
    }

    function functionCallWithValue(address target, bytes memory data, uint256 value, string memory errorMessage) internal returns (bytes memory) {
        require(address(this).balance >= value, "Address: insufficient balance for call");
        return _functionCallWithValue(target, data, value, errorMessage);
    }

    function _functionCallWithValue(address target, bytes memory data, uint256 weiValue, string memory errorMessage) private returns (bytes memory) {
        require(isContract(target), "Address: call to non-contract");

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returndata) = target.call{ value: weiValue }(data);
        if (success) {
            return returndata;
        } else {
            // Look for revert reason and bubble it up if present
            if (returndata.length > 0) {
                // The easiest way to bubble the revert reason is using memory via assembly

                // solhint-disable-next-line no-inline-assembly
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
    using SafeMath for uint256;
    using Address for address;

    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transfer.selector, to, value));
    }

    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transferFrom.selector, from, to, value));
    }

    function safeApprove(IERC20 token, address spender, uint256 value) internal {
        // solhint-disable-next-line max-line-length
        require((value == 0) || (token.allowance(address(this), spender) == 0),
            "SafeERC20: approve from non-zero to non-zero allowance"
        );
        _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, value));
    }

    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 newAllowance = token.allowance(address(this), spender).add(value);
        _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, newAllowance));
    }

    function safeDecreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 newAllowance = token.allowance(address(this), spender).sub(value, "SafeERC20: decreased allowance below zero");
        _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, newAllowance));
    }

    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        bytes memory returndata = address(token).functionCall(data, "SafeERC20: low-level call failed");
        if (returndata.length > 0) { // Return data is optional
            // solhint-disable-next-line max-line-length
            require(abi.decode(returndata, (bool)), "SafeERC20: ERC20 operation did not succeed");
        }
    }
}

contract agoUSDpegger is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 DECIMALS = 18;
    uint256 UNITS = 10 ether;

    struct UserInfo {               // Info of each user.
        uint256 amount;             // How many LP tokens the user has provided.
        uint256 rewardDebt;         // Reward debt. See explanation below.
        uint256 rewardDebtAtBlock;  // the last block user stake
    }

    IERC20 agoUSD;                  // Address of agoUSD token.
    uint256 agoUSDPerBlock;         // Ramps to distribute per block.
    uint256 accAgoUSDPerShare;      // Accumulated agoUSD per share, times 1e18 (UNITS).

    address public agoUSDTokenFarmingWallet;
    uint256 public START_BLOCK;                     // The block number when agoUSD mining starts.
    mapping(address => UserInfo) public userInfo;   // Info of each user that stakes LP tokens. User address => info
    uint256 public feePercentage = 5;               // Default fee to burn is 5%

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event SendAgoUsdReward(address indexed user, uint256 amount);


    constructor(
        address _agoUSDAddress,
        address _agoUSDTokenFarmingWallet,
        uint256 _startBlock
    ) public {
        agoUSD = IERC20(_agoUSDAddress);
        agoUSDTokenFarmingWallet = _agoUSDTokenFarmingWallet;
        START_BLOCK = _startBlock;
        lastRewardBlock = block.number;
    }


    function updateRewardRate(uint256 _agoUSDPerBlock) public onlyOwner {
        updatePool();
        agoUSDPerBlock = _agoUSDPerBlock;
    }


    // Update reward variables to be up-to-date.
    function updatePool() public {
        uint256 poolBalance = agoUSD.balanceOf(address(this));// Retrieve amount of tokens held in contract

        // If the contract holds no tokens at all, don't proceed.
        if (poolBalance == 0) {
            lastRewardBlock = block.number;
            return;
        }

        uint256 rewards = getPoolReward(lastRewardBlock, block.number, agoUSDPerBlock);// Calculate the amount of AgoUSD to send to the contract to pay out for this pool
        accAgoUSDPerShare = accAgoUSDPerShare.add(rewards.mul(UNITS).div(poolBalance));// Update the accumulated AgoUSDPerShare
        lastRewardBlock = block.number;// Update the last block
    }


    // Get rewards for a specific amount of agoUSDPerBlocks
    function getReward(uint256 _from, uint256 _to, uint256 _agoUSDPerBlock)public view returns (uint256 rewards) {
        uint256 blockCount = _to.sub(_from);// Calculate number of blocks covered.
        uint256 rewards = blockCount.mul(_agoUSDPerBlock);// Get the amount of agoUSD
    }



    function claimReward() public {
        updatePool();
        _harvest();
    }


    // Deposit LP tokens to RampStaking for Ramp allocation.
    function deposit(uint256 _amount) public {
        require(_amount > 0, "Amount cannot be 0");
        UserInfo storage user = userInfo[msg.sender];

        updatePool();
        _harvest();

        agoUSD.safeTransferFrom(address(msg.sender), address(this), _amount);

        // This is the very first deposit
        if (user.amount == 0) {
            user.rewardDebtAtBlock = block.number;
        }

        user.amount = user.amount.add(_amount);// * coeficient
        user.rewardDebt = user.amount.mul(accAgoUSDPerShare).div(UNITS);
        emit Deposit(msg.sender, _amount);
    }


    // Withdraw LP tokens from peggerStaking.
    function withdraw(uint256 _poolId, uint256 _amount) public {
        UserInfo storage user = userInfo[msg.sender];
        require(_amount > 0, "Amount cannot be 0");
        require(user.amount >= _amount, "Cannot withdraw more than balance");

        updatePool();
        _harvest();

        user.amount = user.amount.sub(_amount);
        agoUSD.safeTransfer(address(msg.sender), _amount);
        user.rewardDebt = user.amount.mul(accAgoUSDPerShare).div(UNITS);
        emit Withdraw(msg.sender, _amount);
    }


    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw() public {
        UserInfo storage user = userInfo[msg.sender];
        agoUSD.safeTransfer(address(msg.sender), user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
        emit EmergencyWithdraw(msg.sender, user.amount);
    }


    // View function to see pending agoUSD on frontend.
    function pendingReward(address _user) external view returns (uint256) {
        UserInfo storage user = userInfo[_user];
        uint256 accAgoUSDPerShare = accAgoUSDPerShare;
        uint256 poolBalance = token.balanceOf(address(this));

        if (block.number > lastRewardBlock && poolBalance > 0) {
            uint256 rewards = getReward(lastRewardBlock, block.number, agoUSDPerBlock);
            accAgoUSDPerShare = accAgoUSDPerShare.add(rewards.mul(UNITS).div(poolBalance));
        }

        uint256 pending = user.amount.mul(accAgoUSDPerShare).div(UNITS).sub(user.rewardDebt);
        uint256 fee = pending.mul(feePercentage).div(100);
        return pending.sub(fee);
    }


    function setFee(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 10, "Max 10");
        feePercentage = _feePercentage;
    }


    function _harvest() internal{
        UserInfo storage user = userInfo[msg.sender];
        if (user.amount == 0) return;
        uint256 pending = user.amount.mul(accAgoUSDPerShare).div(UNITS).sub(user.rewardDebt);

        if (pending > 0) {
            uint256 fee = pending.mul(feePercentage).div(100);
            agoUSD.burn(fee);
            agoUSD.mint(msg.sender, pending.sub(fee));// mint pending rewards
            user.rewardDebtAtBlock = block.number;
            emit SendAgoUsdReward(msg.sender, pending.sub(fee));
        }

        user.rewardDebt = user.amount.mul(accAgoUSDPerShare).div(UNITS);
    }
}