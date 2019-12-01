pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
// Libraries.
import "@openzeppelin/contracts/math/SafeMath.sol";
// Interfaces and Contracts.
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "./interfaces/ITransact.sol";
import "./lib/XferOrderLib.sol";
import "./lib/XferGrantLib.sol";
import "./Registry.sol";


contract Transact is Initializable, ITransact {
  using SafeMath for uint256;
  using XferOrderLib for XferOrderLib.Data;
  using XferGrantLib for XferGrantLib.Data;

  // Our contracts registry.
  Registry public reg;

  // UNUSED: Our accounts are held in this mapping.
  mapping(address => XferOrderLib.Data[]) oldOrderBook;
  // UNUSED: Our grant / pre-approvals are held in this mapping.
  mapping(address => XferGrantLib.Data[]) oldGrantBook;

  // This is how we keep track of orders.
  mapping(bytes32 => XferOrderLib.Data) orders;
  mapping(address => bytes32[]) orderBook;

  // This is how we keep track of grants.
  mapping(bytes32 => XferGrantLib.Data) grants;
  mapping(address => bytes32[]) grantBook;

  /// Events.

  // Grant-related events.
  event Granted(address indexed owner, address indexed recipient, bytes32 id);

  // Transfer related events.
  event Request(address indexed owner, address indexed recipient, bytes32 id);
  event Approval(address indexed owner, address indexed recipient, bytes32 id);
  event Rejection(address indexed owner, address indexed recipient, bytes32 id);

  /**
   * @dev This is the ZOS constructor.
   * @param _reg is a valid Registry contract to use for other contract calls.
   */
  function initialize(Registry _reg) public initializer {
    reg = _reg;
  }

  /**
   * @dev This function is a callback that should only be used from the Token contract after a
   *      transfer function was called. It creates a pending transfer order.
   * @param owner is the account from which the funds shall be frozen.
   * @param spender is the account that is actually spending the funds.
   * @param recipient is the account to which the funds would be transfered.
   * @param amount is the amount of tokens to include in the transfer.
   */
  function request(
    address owner,
    address spender,
    address recipient,
    uint256 amount
  ) public isActor(owner) isActor(recipient) fromToken
  {
    // Get various order books.
    bytes32[] storage ownerOrders = orderBook[owner];
    bytes32[] storage recipientOrders = orderBook[recipient];
    // Create our new order and its id.
    bytes32 id = generateOrderId(owner, ownerOrders.length);
    XferOrderLib.Data memory order = XferOrderLib.make(
      owner,
      spender,
      recipient,
      amount
    );
    // Add the order id to the owner and recipient book.
    ownerOrders.push(id);
    recipientOrders.push(id);
    // Add the order to the global order list.
    orders[id] = order;
    // Emit!
    emit Request(owner, recipient, id);
  }

  /// @dev Creates an order id.
  function generateOrderId(address owner, uint256 index) public pure returns(bytes32) {
    return keccak256(abi.encodePacked("Order", owner, index));
  }

  /// @dev Counts all order for a given owner.
  function orderCount(address owner) public view returns(uint256) {
    return orderBook[owner].length;
  }

  /// @dev Gets an order id given its owner and index.
  function orderIdAt(address owner, uint256 index) public view returns(bytes32) {
    bytes32[] storage ids = orderBook[owner];
    require(
      index < ids.length,
      "The specified order index is invalid"
    );
    return ids[index];
  }

  /// @dev Gets an order given its owner and the index of its id.
  function orderAt(address owner, uint256 index) public view returns(XferOrderLib.Data memory) {
    return orders[orderIdAt(owner, index)];
  }

  /// @dev Gets an order given it's id.
  function order(bytes32 orderId) public view returns(XferOrderLib.Data memory) {
    XferOrderLib.Data storage o = orders[orderId];
    o.ensureValidStruct();
    return o;
  }

  /**
   * @dev This function is used by governors to pre-approve transfers so a spender can
   *      approve their own transfers.
   * @param owner is the account from which the transfer is approved from.
   * @param recipient is the recipient for the pre-approved transfer.
   * @param maxAmount is how much the transfer can be up to.
   */
  function preapprove(
    address owner,
    address recipient,
    uint256 maxAmount
  ) public governance isActor(owner) isActor(recipient)
  {
    require(owner != recipient, "Recipient cannot be the same as owner");
    // Get the owner order book.
    bytes32[] storage ownerGrants = grantBook[owner];
    // Make a new order id.
    bytes32 id = generateGrantId(owner, ownerGrants.length);
    // Add the grant id to the owner grant book.
    ownerGrants.push(id);
    // Add the order to the global order queue.
    grants[id] = XferGrantLib.make(owner, recipient, maxAmount);
    // Emit!
    emit Granted(owner, recipient, id);
  }

  function generateGrantId(address owner, uint256 index) public pure returns(bytes32) {
    return keccak256(abi.encodePacked("Grant", owner, index));
  }

  /// @dev Counts all grants for a given owner.
  function grantCount(address owner) public view returns(uint256) {
    return grantBook[owner].length;
  }

  /// @dev Gets a grant id given its owner and index.
  function grantIdAt(address owner, uint256 index) public view returns(bytes32) {
    bytes32[] storage ids = grantBook[owner];
    require(
      index < ids.length,
      "The specified grant index is invalid"
    );
    return ids[index];
  }

  /// @dev Gets a grant given its owner and the index of its id.
  function grantAt(address owner, uint256 index) public view returns(XferGrantLib.Data memory) {
    return grants[grantIdAt(owner, index)];
  }

  /// @dev Gets a grant given it's id.
  function grant(bytes32 grantId) public view returns(XferGrantLib.Data memory) {
    XferGrantLib.Data storage g = grants[grantId];
    g.ensureValidStruct();
    return g;
  }

  /**
  * @dev This function approves a transfer using a pre-approved grant which should still be valid.
  *      The transfer must be in the `ITransact.Status.Pending` status.
  * @notice For this to work, `msg.sender` must be a governor.
  * @param orderId is the order id that was returned by the `request` function to create the transfer order.
  * @param orderId is the grant id to use to self-approve.
  */
  function approveGranted(
    bytes32 orderId,
    bytes32 grantId
  ) public isActor(msg.sender)
  {
    // Get the order and grant.
    XferOrderLib.Data storage o = orders[orderId];
    o.ensureValidStruct();
    XferGrantLib.Data storage g = grants[grantId];
    g.ensureValidStruct();
    // Ensure that the order belongs to the message sender.
    require(
      msg.sender == o.owner && msg.sender == g.owner,
      "The specified order and grant must belong to you"
    );
    // Ensure that the pre-approval matches the order.
    require(
      o.recipient == g.recipient,
      "The specified pre-approval doesn't cover this recipient"
    );
    require(
      o.amount <= g.maxAmount,
      "The specified pre-approval doesn't cover for this amount"
    );
    // Update the order status.
    o.approve();
    // Make sure the used grant cannot be used again.
    g.redeem();
    // Make our token contract aware of the changes.
    reg.token().transferApproved(o.owner, o.recipient, o.amount);
    // Emit!
    emit Approval(o.owner, o.recipient, orderId);
  }

  /**
   * @dev This function approves a transfer. The transfer must be in the `ITransact.Status.Pending` status.
   * @notice For this to work, `msg.sender` must be a governor.
   * @param orderId is the order id that was returned by the `request` function to create the transfer order.
   */
  function approve(bytes32 orderId) public governance {
    // Get the order.
    XferOrderLib.Data storage o = orders[orderId];
    o.ensureValidStruct();
    // Update the order status.
    o.approve();
    // Make our token contract aware of the changes.
    reg.token().transferApproved(o.owner, o.recipient, o.amount);
    // Emit!
    emit Approval(o.owner, o.recipient, orderId);
  }

  /**
   * @dev This function rejects a transfer. The transfer must be in the `ITransact.Status.Pending` status.
   *      The function can be called either by a governor or the owner of the funds.
   * @notice For this to work, `msg.sender` must be a governor.
   * @param orderId is the order id that was returned by the `request` function to create the transfer order.
   */
  function reject(bytes32 orderId) public governance {
    // Get the order and update it.
    XferOrderLib.Data storage o = orders[orderId];
    o.ensureValidStruct();
    o.reject();
    // Make our token contract aware of the changes.
    reg.token().transferRejected(o.owner, o.spender, o.amount);
    // Emit!
    emit Rejection(o.owner, o.recipient, orderId);
  }

  // Private / internal stuff.

  function _getGrant(bytes32 grantId) private view returns(XferGrantLib.Data storage) {
    XferGrantLib.Data storage g = grants[grantId];
    g.ensureValidStruct();
    return g;
  }

  // Modifiers.

  modifier governance() {
    require(reg.access().isGovernor(msg.sender), "This function must be called by a governor");
    _;
  }

  modifier isActor(address c) {
    require(reg.access().isActor(c), "Provided account is not an actor");
    _;
  }

  modifier fromToken() {
    require(
      msg.sender == address(reg.token()),
      "This function can only be called by the Token contract"
    );
    _;
  }
}
