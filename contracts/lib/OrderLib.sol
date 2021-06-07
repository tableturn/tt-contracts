// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


library OrderLib {
  using OrderLib for Order;

  enum Status { Pending, Approved, Rejected }
  /// @dev Represents a transfer order, either Pending, Approved or Rejected.
  struct Order {
    bytes32 id;
    address owner;
    address spender;
    address recipient;
    uint256 amount;
    uint256 createdAt;
    Status status;
  }

  /** @dev Makes a new OrderLib.Order structure.
   * @param owner is the owner of the transfer order.
   * @param spender is the account that initiated the transfer order.
   * @param recipient is the target account for the transfer order.
   * @param amount is the amount of funds to be transfered.
   * @return An order object.
   */
  function make(
    bytes32 id,
    address owner,
    address spender,
    address recipient,
    uint256 amount
  ) internal view returns(Order memory)
  {
    return Order({
      id: id,
      owner: owner,
      spender: spender,
      recipient: recipient,
      amount: amount,
      createdAt: block.number,
      status: Status.Pending
    });
  }

  /** @dev Ensures that a given order has all its required members set.
   * @param order is the order object to check.
   */
  function ensureValidStruct(Order storage order) internal view {
    require(
      order.spender != address(0) &&
      order.recipient != address(0) &&
      order.amount != 0 &&
      order.createdAt != 0,
      "The specified order is invalid"
    );
  }

  /**
   * @dev This function updates a transfer. The transfer must be in the `Status.Pending` status.
   * @notice For this to work, `msg.sender` must be a governor.
   * @param order is the order to be updated.
   * @param status is the new status for the order.
   */
  function finalize(Order storage order, Status status) internal {
    // Forbid operating on pending or 0 amount orders.
    require(order.status == Status.Pending, "Cannot update a non-pending order");
    // Update the order.
    order.status = status;
  }

  /// @dev See `finalize`.
  function approve(Order storage order) internal {
    order.finalize(Status.Approved);
  }

  /// @dev See `finalize`.
  function reject(Order storage order) internal {
    order.finalize(Status.Rejected);
  }
}
