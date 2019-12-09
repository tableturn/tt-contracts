pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
import "../lib/OrderLib.sol";


contract OrderLibTester {
  using OrderLib for OrderLib.Order;

  OrderLib.Order private sample1;

  /// @dev Proxy to the `OrderLib.make` function.
  function make(
    bytes32 id,
    address owner,
    address spender,
    address recipient,
    uint256 maxAmount
  ) external view returns(OrderLib.Order memory) {
    return OrderLib.make(
      id,
      owner,
      spender,
      recipient,
      maxAmount
    );
  }

  /// @dev Proxy to the `OrderLib.finalize` function.
  function finalize(OrderLib.Status status) external { sample1.finalize(status); }

  /// @dev Proxy to the `OrderLib.approve` function.
  function approve() external { sample1.approve(); }

  /// @dev Proxy to the `OrderLib.reject` function.
  function reject() external { sample1.reject(); }

  /// @dev Proxy to the `OrderLib.ensureValidStruct` function.
  function ensureValidStruct() external view { sample1.ensureValidStruct(); }

  // ----------------------------------------------------------------------------- //

  /// @dev Sample 1 setter.
  function setSample1(
    bytes32 id,
    address owner,
    address spender,
    address recipient,
    uint256 amount,
    uint256 createdAt,
    OrderLib.Status status) external
  {
    sample1 = OrderLib.make(
      id,
      owner,
      spender,
      recipient,
      amount
    );
    sample1.createdAt = createdAt;
    sample1.status = status;
  }

  /// @dev Sample 1 getter.
  function getSample1() external view returns(OrderLib.Order memory) {
    return sample1;
  }
}
