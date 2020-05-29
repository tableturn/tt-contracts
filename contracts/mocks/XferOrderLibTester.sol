pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
import '../lib/XferOrderLib.sol';


contract XferOrderLibTester {
  using XferOrderLib for XferOrderLib.Data;

  XferOrderLib.Data private sample1;

  /// @dev Proxy to the `XferOrderLib.create` function.
  function create(address owner, address spender, address recipient, uint256 amount)
    external
    returns (bytes32)
  {
    return sample1.create(owner, spender, recipient, amount);
  }

  /// @dev Proxy to the `XferOrderLib.generateId` function.
  function generateId(address owner, uint256 index) external pure returns (bytes32) {
    return XferOrderLib.generateId(owner, index);
  }

  /// @dev Proxy to the `XferOrderLib.count` function.
  function count(address owner) external view returns (uint256) {
    return sample1.count(owner);
  }

  /// @dev Proxy to the `XferOrderLib.idByOwnerAndIndex` function.
  function idByOwnerAndIndex(address owner, uint256 index) external view returns (bytes32) {
    return sample1.idByOwnerAndIndex(owner, index);
  }

  /// @dev Proxy to the `XferOrderLib.byOwnerAndIndex` function.
  function byOwnerAndIndex(address owner, uint256 index)
    external
    view
    returns (OrderLib.Order memory)
  {
    return sample1.byOwnerAndIndex(owner, index);
  }

  /// @dev Proxy to the `XferOrderLib.byId` function.
  function byId(bytes32 id) external view returns (OrderLib.Order memory) {
    return sample1.byId(id);
  }
}
