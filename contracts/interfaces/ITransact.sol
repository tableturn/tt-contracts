// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
// Libraries.
import '../lib/OrderLib.sol';

interface ITransact {
  /**
   * @dev This function is a callback that should only be used from the Token contract after a
   *      transfer function was called. It creates a pending transfer order.
   * @param owner is the account from which the funds shall be frozen.
   * @param spender is the account who is spending the funds - often equal to `owner`.
   * @param recipient is the account to which the funds would be transfered.
   * @param amount is the amount of tokens to include in the transfer.
   * @param ref is the reference to keep along with the order.
   * @return The transfer id that was created.
   */
  function request(address owner, address spender, address recipient, uint256 amount, string calldata ref) external;
}
