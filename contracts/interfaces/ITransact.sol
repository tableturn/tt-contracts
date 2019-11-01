pragma solidity ^0.5.9;


interface ITransact {
  /**
   * @dev This function is a callback that should only be used from the Token contract after a
   *      transfer function was called. It creates a pending transfer order.
   * @param owner is the account from which the funds shall be frozen.
   * @param spender is the account who is spending the funds - often equal to `owner`.
   * @param recipient is the account to which the funds would be transfered.
   * @param amount is the amount of tokens to include in the transfer.
   * @return The transfer id that was created.
   */
  function request(
    address owner,
    address spender,
    address recipient,
    uint256 amount) external;
}
