// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


library HashSetLib {
  /// @dev Represents a list of hashes.
  struct Data {
    mapping(bytes32 => uint256) indices;
    bytes32[] values;
  }

  /**
   * @dev Adds an item into the storage set. If the hash already exists in the
   *      set, the function reverts.
   * @param d is the internal data storage to use.
   * @param key is the hash to be added.
   */
  function add(Data storage d, bytes32 key) internal {
    require(!contains(d, key), "Hash already in set");
    d.indices[key] = d.values.length;
    d.values.push(key);
  }

  /**
   * @dev Removes an item from the storage set. If the hash does not exist in the
   *      set, the function reverts.
   * @param d is the internal data storage to use.
   * @param key is the hash to be removed.
   */
  function remove(Data storage d, bytes32 key) internal {
    require(contains(d, key), "Hash does not exist in set");
    uint256 lastIndex = d.values.length - 1;
    bytes32 keyToMove = d.values[lastIndex];
    uint256 idxToReplace = d.indices[key];
    d.indices[keyToMove] = idxToReplace;
    d.values[idxToReplace] = keyToMove;
    delete d.indices[key];
    d.values.pop();
  }

  /**
   * @dev Counts the number of elements in the internal set.
   * @param d is the internal data storage to use.
   * @return the number of elements in the set.
   */
  function count(Data storage d) external view returns(uint256) {
    return d.values.length;
  }

  /**
   * @dev Tests whether or not a given item already exists in the set.
   * @param d is the internal data storage to use.
   * @param key is the hash to test.
   * @return a boolean.
   */
  function contains(Data storage d, bytes32 key) public view returns(bool) {
    return d.values.length == 0
      ? false
      : d.values[d.indices[key]] == key;
  }
}
