pragma solidity ^0.5.9;
// Libraries.
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


library AccountLib {
  using SafeMath for uint256;
  using AccountLib for Data;

  struct Data {
    uint256 liquid;
    uint256 frozen;
  }

  /**
   * @dev Directly credits an account balance by a certain amount. This function should not be used
   *      except for some exceptional cases.
   * @param account is the target account to credit.
   * @param amount is the number of tokens to add.
   */
  function credit(Data storage account, uint256 amount) internal {
    account.liquid = account.liquid.add(amount);
  }

  /**
   * @dev Directly debits an account balance by a certain amount. This function should not be used
   *      except for some exceptional cases.
   * @param account is the target account to debit.
   * @param amount is the number of tokens to subtract.
   */
  function debit(Data storage account, uint256 amount) internal {
    require(amount <= account.liquid, "Insufficient funds");
    account.liquid = account.liquid.sub(amount);
  }

  /**
   * @dev Freezes an certain number of tokens into an account. The tokens are taken from the `liquid`
   *      field and added to the `frozen` field.
   * @param account is the target account to freeze.
   * @param amount is the number of tokens to freeze.
   */
  function freeze(Data storage account, uint256 amount) internal {
    require(amount <= account.liquid, "Insufficient funds");
    account.debit(amount);
    account.frozen = account.frozen.add(amount);
  }

  /**
   * @dev Un-freezes an certain number of tokens into an account. As un-freezing is often the result of
   *      a transfer, two accounts should be specified as parameters - one from which the token should
   *      be un-frozen from and the other to which the tokens should be credited. Note that it is absolutely
   *      acceptable and valid to specify the same account, eg when a transfer gets canceled.
   * @param account is the target account to un-freeze from.
   * @param recipient is the target account to credit to.
   * @param amount is the number of tokens to un-freeze.
   */
  function unfreeze(Data storage account, Data storage recipient, uint256 amount) internal {
    require(amount <= account.frozen, "Insufficient frozen funds");
    account.frozen = account.frozen.sub(amount);
    recipient.credit(amount);
  }

  /**
   * @dev Directly transfers tokens from an account to another without freezing.
   * @param account is the target account to transfer from.
   * @param recipient is the target account to transfer to.
   * @param amount is the number of tokens to transfer.
   */
  function transfer(Data storage account, Data storage recipient, uint256 amount) internal {
    account.debit(amount);
    recipient.credit(amount);
  }
}
