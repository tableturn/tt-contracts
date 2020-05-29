pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
import '../lib/XferGrantLib.sol';


contract XferGrantLibTester {
  using XferGrantLib for XferGrantLib.Data;

  XferGrantLib.Data private sample1;

  /// @dev Proxy to the `XferGrantLib.create` function.
  function create(address owner, address recipient, uint256 maxAmount) external returns (bytes32) {
    return sample1.create(owner, recipient, maxAmount);
  }

  /// @dev Proxy to the `XferGrantLib.generateId` function.
  function generateId(address owner, uint256 index) external pure returns (bytes32) {
    return XferGrantLib.generateId(owner, index);
  }

  /// @dev Proxy to the `XferGrantLib.count` function.
  function count(address owner) external view returns (uint256) {
    return sample1.count(owner);
  }

  /// @dev Proxy to the `XferGrantLib.idByOwnerAndIndex` function.
  function idByOwnerAndIndex(address owner, uint256 index) external view returns (bytes32) {
    return sample1.idByOwnerAndIndex(owner, index);
  }

  /// @dev Proxy to the `XferGrantLib.byOwnerAndIndex` function.
  function byOwnerAndIndex(address owner, uint256 index)
    external
    view
    returns (GrantLib.Grant memory)
  {
    return sample1.byOwnerAndIndex(owner, index);
  }

  /// @dev Proxy to the `XferGrantLib.byId` function.
  function byId(bytes32 id) external view returns (GrantLib.Grant memory) {
    return sample1.byId(id);
  }
}
