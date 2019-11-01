pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
import "../interfaces/ITransact.sol";


contract TransactMock is ITransact {
  struct RequestCall {
    address owner;
    address spender;
    address recipient;
    uint256 amount;
  }
  RequestCall[] private _requestCalls;

  function request(
    address owner,
    address spender,
    address recipient,
    uint256 amount
  ) public
  {
    _requestCalls.push(
      RequestCall(
        owner,
        spender,
        recipient,
        amount
      )
    );
  }

  function requestCalls() public view returns(RequestCall[] memory) {
    return _requestCalls;
  }
}
