pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
import "../lib/AddressSetLib.sol";


contract AddressSetLibTester {
  using AddressSetLib for AddressSetLib.Data;

  AddressSetLib.Data private sample1;

  function add(address key) public { sample1.add(key); }

  function remove(address key) public { sample1.remove(key); }

  function count() public view returns(uint256) { return sample1.count(); }

  function contains(address key) public view returns(bool) { return sample1.contains(key); }

  // ----------------------------------------------------------------------------- //

  function getSample1Values() public view returns(address[] memory) { return sample1.values; }
}
