pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
import "../lib/XferOrderLib.sol";


contract XferOrderLibTester {
  using XferOrderLib for XferOrderLib.Data;

  XferOrderLib.Data private sample1;

  /// @dev Proxy to the `XferOrderLib.create` function.
  function create(
    address owner,
    address spender,
    address recipient,
    uint256 amount
  ) public returns(bytes32)
  {
    return sample1.create(
      owner,
      spender,
      recipient,
      amount
    );
  }

  /// @dev Proxy to the `XferOrderLib.create` function.
  function generateId(address owner, uint256 index) public pure returns(bytes32) {
    return XferOrderLib.generateId(owner, index);
  }

  /// @dev Proxy to the `XferOrderLib.create` function.
  function count(address owner) public view returns(uint256) {
    return sample1.count(owner);
  }

  /// @dev Proxy to the `XferOrderLib.create` function.
  function idByOwnerAndIndex(address owner, uint256 index) public view returns(bytes32) {
    return sample1.idByOwnerAndIndex(owner, index);
  }

  /// @dev Proxy to the `XferOrderLib.create` function.
  function byOwnerAndIndex(address owner, uint256 index) public view returns(OrderLib.Order memory) {
    return sample1.byOwnerAndIndex(owner, index);
  }

  /// @dev Proxy to the `XferOrderLib.create` function.
  function byId(bytes32 id) public view returns(OrderLib.Order memory) {
    return sample1.byId(id);
  }
}
