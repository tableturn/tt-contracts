pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
import "../lib/XferGrantLib.sol";


contract XferGrantLibTester {
  using XferGrantLib for XferGrantLib.Data;

  XferGrantLib.Data private sample1;

  /// @dev Proxy to the `XferGrantLib.create` function.
  function create(
    address owner,
    address recipient,
    uint256 maxAmount
  ) public returns(bytes32)
  {
    return sample1.create(
      owner,
      recipient,
      maxAmount
    );
  }

  /// @dev Proxy to the `XferGrantLib.create` function.
  function generateId(address owner, uint256 index) public pure returns(bytes32) {
    return XferGrantLib.generateId(owner, index);
  }

  /// @dev Proxy to the `XferGrantLib.create` function.
  function count(address owner) public view returns(uint256) {
    return sample1.count(owner);
  }

  /// @dev Proxy to the `XferGrantLib.create` function.
  function idByOwnerAndIndex(address owner, uint256 index) public view returns(bytes32) {
    return sample1.idByOwnerAndIndex(owner, index);
  }

  /// @dev Proxy to the `XferGrantLib.create` function.
  function byOwnerAndIndex(address owner, uint256 index) public view returns(GrantLib.Grant memory) {
    return sample1.byOwnerAndIndex(owner, index);
  }

  /// @dev Proxy to the `XferGrantLib.create` function.
  function byId(bytes32 id) public view returns(GrantLib.Grant memory) {
    return sample1.byId(id);
  }
}
