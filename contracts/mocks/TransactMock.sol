// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import '../interfaces/ITransact.sol';

contract TransactMock is ITransact {
  struct CallProof {
    address owner;
    address spender;
    address recipient;
    uint256 amount;
    string ref;
  }
  CallProof[] private requests;


  address private constant ZERO_ADDRESS = address(0);
  bytes32 private constant ZERO_ORDER_ID = "00000000000000000000000000000000";

  /// @dev Mocks to the `ITransact.request` function.
  function request(address owner, address spender, address recipient, uint256 amount, string calldata ref)
  external override {
    requests.push(CallProof(owner, spender, recipient, amount, ref));
  }

  // ----------------------------------------------------------------------------- //

  /// @dev Request call proofs getter.
  function getRequestCalls() external view returns (CallProof[] memory) {
    return requests;
  }
}
