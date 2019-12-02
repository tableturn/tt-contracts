pragma solidity ^0.5.9;


library OldV1XferGrantLib {
  using OldV1XferGrantLib for Data;

  enum Status { Valid, Used }
  /// @dev Represents a transfer grant - a pre-approval ahead of time.
  struct Data {
    address recipient;
    uint256 maxAmount;
    Status status;
  }

  /// @dev Makes a new OldV1XferGrantLib.Data structure.
  function make(address recipient, uint256 maxAmount) internal pure returns(Data memory) {
    return Data({
      recipient: recipient,
      maxAmount: maxAmount,
      status: Status.Valid
    });
  }

  function redeem(Data storage grant) internal {
    // Forbid operating on already-reedeemed grants.
    require(
      grant.status == Status.Valid,
      "Cannot redeem an already invalid grant"
    );
    // Update the grant.
    grant.status = Status.Used;
  }
}
