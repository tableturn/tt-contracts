// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


library OldV1XferGrantLib {
  using OldV1XferGrantLib for Data;

  enum Status { Valid, Used }
  /// @dev Represents a transfer grant - a pre-approval ahead of time.
  struct Data {
    address recipient;
    uint256 maxAmount;
    Status status;
  }
}
