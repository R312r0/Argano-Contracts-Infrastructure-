//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

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