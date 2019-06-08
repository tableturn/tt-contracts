pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
import "../interfaces/IToken.sol";


contract TokenMock is IToken {
  struct ApprovalCall {
    address owner;
    address recipient;
    uint256 amount;
  }
  ApprovalCall[] private _approvedCalls;

  function transferApproved(address owner, address recipient, uint256 amount) public {
    _approvedCalls.push(ApprovalCall(owner, recipient, amount));
  }

  function approvedCalls() public view returns(ApprovalCall[] memory) {
    return _approvedCalls;
  }

  struct RejectionCall {
    address owner;
    address spender;
    uint256 amount;
  }
  RejectionCall[] private _rejectedCalls;

  function transferRejected(address owner, address spender, uint256 amount) public {
    _rejectedCalls.push(RejectionCall(owner, spender, amount));
  }

  function rejectedCalls() public view returns(RejectionCall[] memory) {
    return _rejectedCalls;
  }
}
