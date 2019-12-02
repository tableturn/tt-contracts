pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
import "./OrderLib.sol";


library XferOrderLib {
  using XferOrderLib for Data;
  using OrderLib for OrderLib.Order;

  enum Status { Pending, Approved, Rejected }
  /// @dev Represents a transfer order, either Pending, Approved or Rejected.
  struct Data {
    mapping(bytes32 => OrderLib.Order) orders;
    mapping(address => bytes32[]) ids;
  }

  function create(
    Data storage data,
    address owner,
    address spender,
    address recipient,
    uint256 amount
  ) internal returns(bytes32)
  {
    require(owner != recipient, "Recipient cannot be the same as owner");
    // Get various order books.
    bytes32[] storage ownerOrders = data.ids[owner];
    // Create our new order and its id.
    bytes32 id = generateId(owner, ownerOrders.length);
    // Create a new order.
    OrderLib.Order memory order = OrderLib.make(
      owner,
      spender,
      recipient,
      amount
    );
    // Add the order id to the owner and recipient book.
    ownerOrders.push(id);
    data.ids[recipient].push(id);
    // Add the order to the global order list.
    data.orders[id] = order;
    return id;
  }

  /// @dev Creates an order id.
  function generateId(address owner, uint256 index) internal pure returns(bytes32) {
    return keccak256(abi.encodePacked("Order", owner, index));
  }

  /// @dev Counts received and sent orders for a given account.
  function count(Data storage data, address account) internal view returns(uint256) {
    return data.ids[account].length;
  }

  /// @dev Retrieves an order id given its account and index.
  function idByOwnerAndIndex(Data storage data, address account, uint256 index) internal view returns(bytes32) {
    bytes32[] storage ids = data.ids[account];
    require(
      index < ids.length,
      "The specified order index is invalid"
    );
    return ids[index];
  }

  /// @dev Retrieves an order given its owner and index.
  function byOwnerAndIndex(Data storage data, address account, uint256 index) internal view returns(OrderLib.Order storage) {
    return data.orders[data.idByOwnerAndIndex(account, index)];
  }

  /// @dev Retrieves an order given its id.
  function byId(Data storage data, bytes32 id) internal view returns(OrderLib.Order storage) {
    OrderLib.Order storage o = data.orders[id];
    o.ensureValidStruct();
    return o;
  }
}
