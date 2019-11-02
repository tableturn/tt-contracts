pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
import "../lib/XferGrantLib.sol";


contract XferGrantLibTester {
  using XferGrantLib for XferGrantLib.Data;

  XferGrantLib.Data private sample1;

  /// @dev Proxy to the `XferGrantLib.make` function.
  function make(address recipient, uint256 maxAmount) public pure returns(XferGrantLib.Data memory) {
    return XferGrantLib.make(recipient, maxAmount);
  }

  /// @dev Proxy to the `XferGrantLib.redeem` function.
  function redeem() public { sample1.redeem(); }

  // ----------------------------------------------------------------------------- //

  /// @dev Sample 1 getter.
  function setSample1(address recipient, uint256 maxAmount, XferGrantLib.Status status) public {
    sample1 = XferGrantLib.make(recipient, maxAmount);
    sample1.status = status;
  }

  /// @dev Sample 1 setter.
  function getSample1() public view returns(XferGrantLib.Data memory) {
    return sample1;
  }
}
