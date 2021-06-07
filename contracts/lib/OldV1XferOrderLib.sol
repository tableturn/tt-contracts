// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


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
}
