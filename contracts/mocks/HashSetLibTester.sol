pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
import "../lib/HashSetLib.sol";


contract HashSetLibTester {
  using HashSetLib for HashSetLib.Data;

  HashSetLib.Data private sample1;

  function add(bytes32 key) public { sample1.add(key); }

  function remove(bytes32 key) public { sample1.remove(key); }

  function count() public view returns(uint256) { return sample1.count(); }

  function contains(bytes32 key) public view returns(bool) { return sample1.contains(key); }

  // ----------------------------------------------------------------------------- //

  function getSample1Values() public view returns(bytes32[] memory) { return sample1.values; }
}
