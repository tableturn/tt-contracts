pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;


library OldV1XferOrderLib {
  using OldV1XferOrderLib for Data;

  enum Status { Pending, Approved, Rejected }
  /// @dev Represents a transfer order, either Pending, Approved or Rejected.
  struct Data {
    address spender;
    address recipient;
    uint256 amount;
    uint256 createdAt;
    Status status;
  }

  /// @dev Makes a new OldV1XferOrderLib.Data structure.
  function make(address spender, address recipient, uint256 amount) internal view returns(Data memory) {
    return Data({
      spender: spender,
      recipient: recipient,
      amount: amount,
      createdAt: block.number,
      status: Status.Pending
    });
  }

  /**
   * @dev This function updates a transfer. The transfer must be in the `Status.Pending` status.
   * @notice For this to work, `msg.sender` must be a governor.
   * @param order is the order to be updated.
   * @param status is the new status for the order.
   */
  function finalize(Data storage order, Status status) internal {
    // Forbid operating on pending or 0 amount orders.
    require(order.status == Status.Pending, "Cannot update a non-pending order");
    // Update the order.
    order.status = status;
  }

  function approve(Data storage order) internal {
    order.finalize(Status.Approved);
  }

  function reject(Data storage order) internal {
    order.finalize(Status.Rejected);
  }
}
