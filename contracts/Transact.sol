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
  // Our accounts are held in this mapping.
  mapping(address => XferOrderLib.Data[]) orderBook;
  // Our grant / pre-approvals are held in this mapping.
  mapping(address => XferGrantLib.Data[]) grantBook;

  /// Events.

  event Granted(address indexed owner, uint256 grantId);
  event Request(address indexed owner, uint256 orderId);
  event Approval(address indexed owner, uint256 orderId);
  event Rejection(address indexed owner, uint256 orderId);

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
    XferOrderLib.Data[] storage orders = orderBook[owner];
    // Store new order.
    orders.push(XferOrderLib.make(spender, recipient, amount));
    // Emit!
    emit Request(owner, orders.length - 1);
  }

  /// @dev Counts all order for a given owner.
  function countOrders(address owner) public view returns(uint256) {
    return orderBook[owner].length;
  }

  /// @dev Gets all order for a given owner.
  function allOrders(address owner) public view returns(XferOrderLib.Data[] memory) {
    return orderBook[owner];
  }

  /// @dev Gets a order given its owner and its id.
  function getOrder(address owner, uint256 orderId) public view returns(XferOrderLib.Data memory) {
    return _getOrder(owner, orderId);
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
    XferGrantLib.Data[] storage grants = grantBook[owner];
    grants.push(XferGrantLib.make(recipient, maxAmount));
    emit Granted(owner, grants.length - 1);
  }

  /// @dev Counts all grants for a given owner.
  function countGrants(address owner) public view returns(uint256) {
    return grantBook[owner].length;
  }

  /// @dev Gets all grants for a given owner.
  function allGrants(address owner) public view returns(XferGrantLib.Data[] memory) {
    return grantBook[owner];
  }

  /// @dev Gets a grant given its owner and its id.
  function getGrant(address owner, uint256 grantId) public view returns(XferGrantLib.Data memory) {
    return _getGrant(owner, grantId);
  }

  /**
  * @dev This function approves a transfer using a pre-approved grant which should still be valid.
  *      The transfer must be in the `ITransact.Status.Pending` status.
  * @notice For this to work, `msg.sender` must be a governor.
  * @param owner is the account to which the transfer belongs to.
  * @param orderId is the order id that was returned by the `request` function to create the transfer order.
  */
  function approveGranted(
    address owner,
    uint256 orderId,
    uint256 grantId
  ) public isActor(owner)
  {
    // Get the order.
    XferOrderLib.Data storage order = _getOrder(owner, orderId);
    // Get the pre-approval grant.
    XferGrantLib.Data storage grant = _getGrant(owner, grantId);
    // Ensure that the pre-approval matches the order.
    require(
      order.recipient == grant.recipient,
      "The specified pre-approval doesn't cover this recipient"
    );
    require(
      order.amount <= grant.maxAmount,
      "The specified pre-approval doesn't cover for this amount"
    );
    // Update the order status.
    order.approve();
    // Make sure the used grant cannot be used again.
    grant.redeem();
    // Make our token contract aware of the changes.
    reg.token().transferApproved(owner, order.recipient, order.amount);
    // Emit!
    emit Approval(owner, orderId);
  }

  /**
   * @dev This function approves a transfer. The transfer must be in the `ITransact.Status.Pending` status.
   * @notice For this to work, `msg.sender` must be a governor.
   * @param owner is the account to which the transfer belongs to.
   * @param orderId is the order id that was returned by the `request` function to create the transfer order.
   */
  function approve(address owner, uint256 orderId) public governance isActor(owner) {
    // Get the order.
    XferOrderLib.Data storage order = _getOrder(owner, orderId);
    // Update the order status.
    order.approve();
    // Make our token contract aware of the changes.
    reg.token().transferApproved(owner, order.recipient, order.amount);
    // Emit!
    emit Approval(owner, orderId);
  }

  /**
   * @dev This function rejects a transfer. The transfer must be in the `ITransact.Status.Pending` status.
   *      The function can be called either by a governor or the owner of the funds.
   * @notice For this to work, `msg.sender` must be a governor.
   * @param owner is the account to which the transfer belongs to.
   * @param orderId is the order id that was returned by the `request` function to create the transfer order.
   */
  function reject(address owner, uint256 orderId) public governance isActor(owner) {
    // Get the order.
    XferOrderLib.Data storage order = _getOrder(owner, orderId);
    address spender = order.spender;
    // Update the order.
    order.reject();
    // Make our token contract aware of the changes.
    reg.token().transferRejected(owner, spender, order.amount);
    // Emit!
    emit Rejection(owner, orderId);
  }

  // Private / internal stuff.

  function _getOrder(address owner, uint256 orderId) internal view returns(XferOrderLib.Data storage) {
    XferOrderLib.Data[] storage orders = orderBook[owner];
    require(orderId < orders.length, "The specified order id is invalid");
    return orders[orderId];
  }

  function _getGrant(address owner, uint256 grantId) internal view returns(XferGrantLib.Data storage) {
    XferGrantLib.Data[] storage grants = grantBook[owner];
    require(grantId < grants.length, "The specified grant id is invalid");
    return grants[grantId];
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
