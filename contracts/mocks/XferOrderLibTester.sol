pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
import "../lib/XferOrderLib.sol";


contract XferOrderLibTester {
  using XferOrderLib for XferOrderLib.Data;

  XferOrderLib.Data private sample1;

  /// @dev Proxy to the `XferOrderLib.make` function.
  function make(address spender, address recipient, uint256 maxAmount) public view returns(XferOrderLib.Data memory) {
    return XferOrderLib.make(spender, recipient, maxAmount);
  }

  /// @dev Proxy to the `XferOrderLib.finalize` function.
  function finalize(XferOrderLib.Status status) public { sample1.finalize(status); }

  /// @dev Proxy to the `XferOrderLib.approve` function.
  function approve() public { sample1.approve(); }

  /// @dev Proxy to the `XferOrderLib.reject` function.
  function reject() public { sample1.reject(); }

  // ----------------------------------------------------------------------------- //

  /// @dev Sample 1 setter.
  function setSample1(
    address spender,
    address recipient,
    uint256 amount,
    uint256 createdAt,
    XferOrderLib.Status status) public
  {
    sample1 = XferOrderLib.make(spender, recipient, amount);
    sample1.createdAt = createdAt;
    sample1.status = status;
  }

  /// @dev Sample 1 getter.
  function getSample1() public view returns(XferOrderLib.Data memory) {
    return sample1;
  }
}
