pragma solidity ^0.5.9;


interface IToken {
  /**
   * @dev This function is a callback that should only be used from the Transact contract after a
   *      transfer order was approved.
   * @param owner is the account owning the funds, eg on behalf of which the transfer will be made.
   * @param recipient is the account that shall receive the funds.
   * @param amount is the quantity of tokens to transfer from the owner account.
   */
  function transferApproved(address owner, address recipient, uint256 amount) external;

  /**
   * @dev This function is a callback and is called exclusivelly by the Transact contract.
   *      It reverts a transfer order by thawing the funds on the owner account and crediting
   *      them back on the owner liquid balance. If the transfer was made by allowance, it
   *      restores that allowance to the spender.
   * @param owner is the account owning the funds.
   * @param spender is the account performing the operation. It could be the same as `owner`.
   * @param amount is the quantity of tokens to transfer from the owner account.
   */
  function transferRejected(address owner, address spender, uint256 amount) external;
}
