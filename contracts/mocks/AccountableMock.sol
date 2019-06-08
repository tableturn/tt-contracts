pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
import "../lib/Accountable.sol";


contract AccountableMock {
  using Accountable for Accountable.Account;

  Accountable.Account public first;
  Accountable.Account public second;

  function credit(uint256 value) public { first.credit(value); }

  function debit(uint256 value) public { first.debit(value); }

  function freeze(uint256 value) public { first.freeze(value); }

  function unfreezeSelf(uint256 value) public { first.unfreeze(first, value); }

  function unfreezeOther(uint256 value) public { first.unfreeze(second, value); }

  function transfer(uint256 value) public { first.transfer(second, value); }

  function getFirst() public view returns(Accountable.Account memory) {
    return first;
  }

  function getSecond() public view returns(Accountable.Account memory) {
    return second;
  }

  function setFirst(uint256 liquid, uint256 frozen) public {
    first.liquid = liquid;
    first.frozen = frozen;
  }

  function setSecond(uint256 liquid, uint256 frozen) public {
    second.liquid = liquid;
    second.frozen = frozen;
  }
}
