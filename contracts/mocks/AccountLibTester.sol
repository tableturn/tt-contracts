pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
import "../lib/AccountLib.sol";


contract AccountLibTester {
  using AccountLib for AccountLib.Data;

  AccountLib.Data public sample1;
  AccountLib.Data public sample2;

  /// @dev Proxy to the `AccountLib.credit` function.
  function credit(uint256 value) public { sample1.credit(value); }

  /// @dev Proxy to the `AccountLib.debit` function.
  function debit(uint256 value) public { sample1.debit(value); }

  /// @dev Proxy to the `AccountLib.freeze` function.
  function freeze(uint256 value) public { sample1.freeze(value); }

  /// @dev Proxy to the `AccountLib.unfreeze` function.
  function unfreezeSelf(uint256 value) public { sample1.unfreeze(sample1, value); }

  /// @dev Proxy to the `AccountLib.unfreeze` function.
  function unfreezeOther(uint256 value) public { sample1.unfreeze(sample2, value); }

  /// @dev Proxy to the `AccountLib.transfer` function.
  function transfer(uint256 value) public { sample1.transfer(sample2, value); }

  // ----------------------------------------------------------------------------- //

  /// @dev Sample 1 setter.
  function setSample1(uint256 liquid, uint256 frozen) public {
    sample1.liquid = liquid;
    sample1.frozen = frozen;
  }

  /// @dev Sample 1 getter.
  function getSample1() public view returns(AccountLib.Data memory) {
    return sample1;
  }

  /// @dev Sample 2 setter.
  function setSample2(uint256 liquid, uint256 frozen) public {
    sample2.liquid = liquid;
    sample2.frozen = frozen;
  }

  /// @dev Sample 2 getter.
  function getSample2() public view returns(AccountLib.Data memory) {
    return sample2;
  }
}
