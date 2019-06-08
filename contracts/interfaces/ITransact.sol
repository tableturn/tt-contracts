pragma solidity ^0.5.9;


interface ITransact {
  enum Status { Pending, Approved, Rejected }

  /// @dev Represents an order, either Pending, Approved or Rejected.
  struct Order {
    address spender;
    address recipient;
    uint256 amount;
    uint256 createdAt;
    Status status;
  }

  /// @dev Represents a group of orders and the index to use for the next one.
  struct Book {
    uint256 nextId;
    mapping (uint256 => Order) orders;
  }

  /**
   * @dev This function is a callback that should only be used from the Token contract after a
   *      transfer function was called. It creates a pending transfer order.
   * @param owner is the account from which the funds shall be frozen.
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
