pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;


library GrantLib {
  enum Status { Valid, Used }
  /// @dev Represents a transfer order, either Pending, Approved or Rejected.
  struct Grant {
    address owner;
    address recipient;
    uint256 maxAmount;
    Status status;
  }

  /** @dev Makes a new grant given a set of parameters.
   * @param owner is the owner for which the grant applies.
   * @param recipient is the recipient for which the grant applies.
   * @param maxAmount is up to how much the grant can cover.
   * @return A grant object.
   */
  function make(
    address owner,
    address recipient,
    uint256 maxAmount
  ) internal pure returns(Grant memory)
  {
    return Grant({
      owner: owner,
      recipient: recipient,
      maxAmount: maxAmount,
      status: Status.Valid
    });
  }

  /** @dev Verifies that a grant struct exists and has been properly initialized.
   * @param grant is the grant object to check.
   */
  function ensureValidStruct(Grant storage grant) internal view {
    require(
      grant.owner != address(0) &&
      grant.recipient != address(0) &&
      grant.maxAmount != 0,
      "The specified grant is invalid"
    );
  }

  /** @dev Redeems a grant and marks it as used.
   * @param grant is the grant to redeem.
   */
  function redeem(Grant storage grant) internal {
    // Forbid operating on already-reedeemed grants.
    require(
      grant.status == Status.Valid,
      "Cannot redeem an already invalid grant"
    );
    // Update the grant.
    grant.status = Status.Used;
  }
}
