pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
import '../interfaces/ITransact.sol';


contract TransactMock is ITransact {
  struct CallProof {
    address owner;
    address spender;
    address recipient;
    uint256 amount;
  }
  CallProof[] private requests;

  /// @dev Mocks to the `ITransact.request` function.
  function request(address owner, address spender, address recipient, uint256 amount) external {
    requests.push(CallProof(owner, spender, recipient, amount));
  }

  // ----------------------------------------------------------------------------- //

  /// @dev Request call proofs getter.
  function getRequestCalls() external view returns (CallProof[] memory) {
    return requests;
  }
}
