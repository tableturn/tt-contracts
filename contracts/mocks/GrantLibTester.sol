pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
import "../lib/GrantLib.sol";


contract GrantLibTester {
  using GrantLib for GrantLib.Grant;

  GrantLib.Grant private sample1;

  /// @dev Proxy to the `GrantLib.make` function.
  function make(
    bytes32 id,
    address owner,
    address recipient,
    uint256 maxAmount
  ) external pure returns(GrantLib.Grant memory)
  {
    return GrantLib.make(
      id,
      owner,
      recipient,
      maxAmount
    );
  }

  /// @dev Proxy to the `GrantLib.redeem` function.
  function redeem() external { sample1.redeem(); }

  /// @dev Proxy to the `GrantLib.ensureValidStruct` function.
  function ensureValidStruct() external view { sample1.ensureValidStruct(); }

  // ----------------------------------------------------------------------------- //

  /// @dev Sample 1 setter.
  function setSample1(
    bytes32 id,
    address owner,
    address recipient,
    uint256 maxAmount,
    GrantLib.Status status
  ) external
  {
    sample1 = GrantLib.make(
      id,
      owner,
      recipient,
      maxAmount
    );
    sample1.status = status;
  }

  /// @dev Sample 1 getter.
  function getSample1() external view returns(GrantLib.Grant memory) {
    return sample1;
  }
}
