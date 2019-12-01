pragma solidity ^0.5.9;


library XferGrantLib {
  using XferGrantLib for Data;

  enum Status { Valid, Used }
  /// @dev Represents a transfer grant - a pre-approval ahead of time.
  struct Data {
    address owner;
    address recipient;
    uint256 maxAmount;
    Status status;
  }

  /// @dev Makes a new XferGrantLib.Data structure.
  function make(address owner, address recipient, uint256 maxAmount) internal pure returns(Data memory) {
    return Data({
      owner: owner,
      recipient: recipient,
      maxAmount: maxAmount,
      status: Status.Valid
    });
  }

  function ensureValidStruct(Data storage grant) internal view {
    require(
      grant.owner != address(0) &&
      grant.recipient != address(0) &&
      grant.maxAmount != 0,
      "The specified grant is invalid"
    );
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
