pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
import "../lib/XferGrantLib.sol";


contract XferGrantLibTester {
  using XferGrantLib for XferGrantLib.Data;

  XferGrantLib.Data private sample1;

  /// @dev Proxy to the `XferGrantLib.make` function.
  function make(address owner, address recipient, uint256 maxAmount) public pure returns(XferGrantLib.Data memory) {
    return XferGrantLib.make(owner, recipient, maxAmount);
  }

  /// @dev Proxy to the `XferGrantLib.redeem` function.
  function redeem() public { sample1.redeem(); }

  /// @dev Proxy to the `XferGrantLib.ensureValidStruct` function.
  function ensureValidStruct() public view { sample1.ensureValidStruct(); }

  // ----------------------------------------------------------------------------- //

  /// @dev Sample 1 getter.
  function setSample1(
    address owner,
    address recipient,
    uint256 maxAmount,
    XferGrantLib.Status status
  ) public
  {
    sample1 = XferGrantLib.make(owner, recipient, maxAmount);
    sample1.status = status;
  }

  /// @dev Sample 1 setter.
  function getSample1() public view returns(XferGrantLib.Data memory) {
    return sample1;
  }
}
