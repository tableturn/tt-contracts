// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import '../interfaces/IToken.sol';


contract TokenMock is IToken {
  struct CallProof {
    address owner;
    address target;
    uint256 amount;
  }
  CallProof[] private approvals;
  CallProof[] private rejections;

  /// @dev Mocks to the `IToken.transferApproved` function.
  function transferApproved(address owner, address recipient, uint256 amount) external {
    approvals.push(CallProof(owner, recipient, amount));
  }

  /// @dev Mocks to the `IToken.transferRejected` function.
  function transferRejected(address owner, address spender, uint256 amount) external {
    rejections.push(CallProof(owner, spender, amount));
  }

  // ----------------------------------------------------------------------------- //

  /// @dev Approval call proofs getter.
  function getApprovedCalls() external view returns (CallProof[] memory) {
    return approvals;
  }

  /// @dev Rejection call proofs getter.
  function getRejectedCalls() external view returns (CallProof[] memory) {
    return rejections;
  }
}
