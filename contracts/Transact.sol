pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
// Libraries.
import "@openzeppelin/contracts/math/SafeMath.sol";
// Legacy.
import "./lib/OldV1XferOrderLib.sol";
import "./lib/OldV1XferGrantLib.sol";
// Interfaces and Contracts.
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "./interfaces/ITransact.sol";
import "./lib/OrderLib.sol";
import "./lib/GrantLib.sol";
import "./lib/XferOrderLib.sol";
import "./lib/XferGrantLib.sol";
import "./Registry.sol";


contract Transact is Initializable, ITransact {
  // Libs and types.
  using SafeMath for uint256;
  using OrderLib for OrderLib.Order;
  using GrantLib for GrantLib.Grant;
  using XferOrderLib for XferOrderLib.Data;
  using XferGrantLib for XferGrantLib.Data;

  // Our contracts registry.
  Registry public reg;

  // LEGACY: Our accounts are held in this mapping.
  mapping(address => OldV1XferOrderLib.Data[]) oldV1OrderBook;
  // LEGACY: Our grants / pre-approvals are held in this mapping.
  mapping(address => OldV1XferGrantLib.Data[]) oldV1GrantBook;

  // This is how we keep track of orders and grants.
  XferOrderLib.Data orderData;
  XferGrantLib.Data grantData;

  /// Old Events.

  /// V1 Events.
  event Granted(address indexed owner, uint256 grantId);
  event Request(address indexed owner, uint256 orderId);
  event Approval(address indexed owner, uint256 orderId);
  event Rejection(address indexed owner, uint256 orderId);

  /// Events.

  // Grant-related events.
  event GrantedV2(address indexed owner, address indexed recipient, bytes32 id);
  // Transfer related events.
  event RequestV2(address indexed owner, address indexed recipient, bytes32 id);
  event ApprovalV2(address indexed owner, address indexed recipient, bytes32 id);
  event RejectionV2(address indexed owner, address indexed recipient, bytes32 id);

  /**
   * @dev This is the ZOS constructor.
   * @param pReg is a valid Registry contract to use for other contract calls.
   */
  function initialize(Registry pReg) external initializer {
    reg = pReg;
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
  )
  external
    isActor(owner)
    isActor(recipient)
    isPositive(amount)
    fromToken
  {
    // Create our new order id.
    bytes32 id = orderData.create(
      owner,
      spender,
      recipient,
      amount
    );
    emit RequestV2(owner, recipient, id);
  }

  /** @dev Counts all order for a given owner.
   * @param owner is the address for which to count orders.
   * @return The count of orders for the given owner, including sent and received orders.
   */
  function orderCount(address owner) external isActor(owner) view returns(uint256) {
    return orderData.count(owner);
  }

  /** @dev Gets an order id given its owner and index.
   * @param owner is the address for which to get the order id.
   * @param index is the index of the order id to be retrieved.
   * @return An order id when the call succeeds, otherwise throws.
   */
  function orderIdByOwnerAndIndex(address owner, uint256 index) external isActor(owner) view returns(bytes32) {
    return orderData.idByOwnerAndIndex(owner, index);
  }

  /** @dev Gets an order given its owner and the index of its id.
   * @param owner is the address for which to get the order.
   * @param index is the index of the order to be retrieved.
   * @return An order when the call succeeds, otherwise throws.
   */
  function orderByOwnerAndIndex(address owner, uint256 index) external isActor(owner) view returns(OrderLib.Order memory) {
    return orderData.byOwnerAndIndex(owner, index);
  }

  /** @dev Gets an order given it's id.
   * @param orderId is the order id to look for.
   * @return An order when the call succeeds, otherwise throws.
   */
  function orderById(bytes32 orderId) external view returns(OrderLib.Order memory) {
    return orderData.byId(orderId);
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
  )
  external
    governance
    isActor(owner)
    isActor(recipient)
  {
    bytes32 id = grantData.create(owner, recipient, maxAmount);
    emit GrantedV2(owner, recipient, id);
  }

  /** @dev Counts all grant for a given owner.
   * @param owner is the address for which to count grants.
   * @return The count of grants for the given owner, including sent and received orders.
   */
  function grantCount(address owner) external isActor(owner) view returns(uint256) {
    return grantData.count(owner);
  }

  /** @dev Gets a grant id given its owner and index.
   * @param owner is the address for which to get the grant id.
   * @param index is the index of the grant id to be retrieved.
   * @return An grant id when the call succeeds, otherwise throws.
   */
  function grantIdByOwnerAndIndex(address owner, uint256 index) external isActor(owner) view returns(bytes32) {
    return grantData.idByOwnerAndIndex(owner, index);
  }

  /** @dev Gets a grant given its owner and the index of its id.
   * @param owner is the address for which to get the grant.
   * @param index is the index of the grant to be retrieved.
   * @return An grant when the call succeeds, otherwise throws.
   */
  function grantByOwnerAndIndex(address owner, uint256 index) external view isActor(owner) returns(GrantLib.Grant memory) {
    return grantData.byOwnerAndIndex(owner, index);
  }

  /** @dev Gets a grant given it's id.
   * @param grantId is the grant id to look for.
   * @return An grant when the call succeeds, otherwise throws.
   */
  function grantById(bytes32 grantId) external view returns(GrantLib.Grant memory) {
    return grantData.byId(grantId);
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
  )
  external
    isActor(msg.sender)
  {
    // Get the order and grant.
    OrderLib.Order storage o = orderData.byId(orderId);
    GrantLib.Grant storage g = grantData.byId(grantId);
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
    emit ApprovalV2(o.owner, o.recipient, orderId);
  }

  /**
   * @dev This function approves a transfer. The transfer must be in the `ITransact.Status.Pending` status.
   * @notice For this to work, `msg.sender` must be a governor.
   * @param orderId is the order id that was returned by the `request` function to create the transfer order.
   */
  function approve(bytes32 orderId) external governance {
    // Get the order.
    OrderLib.Order storage o = orderData.byId(orderId);
    // Update the order status.
    o.approve();
    // Make our token contract aware of the changes.
    reg.token().transferApproved(o.owner, o.recipient, o.amount);
    // Emit!
    emit ApprovalV2(o.owner, o.recipient, orderId);
  }

  /**
   * @dev This function rejects a transfer. The transfer must be in the `ITransact.Status.Pending` status.
   *      The function can be called either by a governor or the owner of the funds.
   * @notice For this to work, `msg.sender` must be a governor.
   * @param orderId is the order id that was returned by the `request` function to create the transfer order.
   */
  function reject(bytes32 orderId) external governance {
    // Get the order and update it.
    OrderLib.Order storage o = orderData.byId(orderId);
    o.reject();
    // Make our token contract aware of the changes.
    reg.token().transferRejected(o.owner, o.spender, o.amount);
    // Emit!
    emit RejectionV2(o.owner, o.recipient, orderId);
  }

  // Modifiers.

  modifier governance() {
    require(reg.access().isGovernor(msg.sender), "This function must be called by a governor");
    _;
  }

  modifier isPositive(uint256 amount) {
    require(amount > 0, "Amount cannot be zero");
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
