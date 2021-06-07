// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import '../lib/HashSetLib.sol';


contract HashSetLibTester {
  using HashSetLib for HashSetLib.Data;

  HashSetLib.Data private sample1;

  /// @dev Proxy to the `HashSetLib.add` function.
  function add(bytes32 key) external {
    sample1.add(key);
  }

  /// @dev Proxy to the `HashSetLib.remove` function.
  function remove(bytes32 key) external {
    sample1.remove(key);
  }

  /// @dev Proxy to the `HashSetLib.count` function.
  function count() external view returns (uint256) {
    return sample1.count();
  }

  /// @dev Proxy to the `HashSetLib.contains` function.
  function contains(bytes32 key) external view returns (bool) {
    return sample1.contains(key);
  }

  // ----------------------------------------------------------------------------- //

  /// @dev Sample 1 getter.
  function getSample1Values() external view returns (bytes32[] memory) {
    return sample1.values;
  }
}
