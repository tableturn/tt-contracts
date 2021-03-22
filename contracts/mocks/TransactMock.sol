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


  address private constant ZERO_ADDRESS = address(0);
  bytes32 private constant ZERO_ORDER_ID = "00000000000000000000000000000000";

  /// @dev Mocks to the `ITransact.request` function.
  function request(address owner, address spender, address recipient, uint256 amount) external {
    requests.push(CallProof(owner, spender, recipient, amount));
  }

  /// @dev Mocks to the `ITransact.orderCount` function.
  function orderCount(address) external pure returns (uint256) {
    return 0;
  }

  /// @dev Mocks to the `ITransact.orderIdByOwnerAndIndex` function.
  function orderIdByOwnerAndIndex(address, uint256) external pure returns (bytes32) {
    return ZERO_ORDER_ID;
  }

  /// @dev Mocks to the `ITransact.orderByOwnerAndIndex` function.
  function orderByOwnerAndIndex(address, uint256) external view returns (OrderLib.Order memory) {
    return OrderLib.make(ZERO_ORDER_ID, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, 0);
  }

  /// @dev Mocks to the `ITransact.approveGranted` function.
  function approveGranted(bytes32, bytes32) external {}

  /// @dev Mocks to the `ITransact.approve` function.
  function approve(bytes32) external {}

  /// @dev Mocks to the `ITransact.reject` function.
  function reject(bytes32) external {}

  // ----------------------------------------------------------------------------- //

  /// @dev Request call proofs getter.
  function getRequestCalls() external view returns (CallProof[] memory) {
    return requests;
  }
}
