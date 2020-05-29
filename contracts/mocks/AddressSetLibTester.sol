pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
import '../lib/AddressSetLib.sol';


contract AddressSetLibTester {
  using AddressSetLib for AddressSetLib.Data;

  AddressSetLib.Data private sample1;

  /// @dev Proxy to the `AddressSetLib.add` function.
  function add(address key) external {
    sample1.add(key);
  }

  /// @dev Proxy to the `AddressSetLib.remove` function.
  function remove(address key) external {
    sample1.remove(key);
  }

  /// @dev Proxy to the `AddressSetLib.count` function.
  function count() external view returns (uint256) {
    return sample1.count();
  }

  /// @dev Proxy to the `AddressSetLib.contains` function.
  function contains(address key) external view returns (bool) {
    return sample1.contains(key);
  }

  // ----------------------------------------------------------------------------- //

  /// @dev Sample1 getter.
  function getSample1Values() external view returns (address[] memory) {
    return sample1.values;
  }
}
