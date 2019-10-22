pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;
// Libraries.
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
// Interfaces and Contracts.
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "./interfaces/ITransact.sol";
import "./Registry.sol";


contract Transact is Initializable, ITransact {
  using SafeMath for uint256;

  // Our contracts registry.
  Registry public reg;
  // Our accounts are held in this mapping.
  mapping(address => Order[]) orderBook;
  mapping(address => Grant[]) grantBook;

  /// Events.

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
    Order[] storage orders = orderBook[owner];
    // Store new order.
    orders.push(
      Order({
        spender: spender,
        recipient: recipient,
        amount: amount,
        createdAt: block.number,
        status: ITransact.Status.Pending
      })
    );
    // Emit!
    emit Request(owner, orders.length - 1);
  }

  function count(address owner) public view returns(uint256) {
    return orderBook[owner].length;
  }

  function all(address owner) public view returns(Order[] memory) {
    return orderBook[owner];
  }

  function get(address owner, uint256 orderId) public view returns(Order memory) {
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
    Grant[] storage grants = grantBook[owner];
    grants.push(
      Grant({
        approver: msg.sender,
        owner: owner,
        recipient: recipient,
        maxAmount: maxAmount,
        valid: true
      })
    );
    emit Granted(owner, grants.length - 1);
  }

  function approveGranted(
    address owner,
    uint256 orderId,
    uint256 grantId
  ) public isActor(msg.sender) isActor(owner)
  {
    // Get the order.
    Order storage order = _getOrder(owner, orderId);
    // Get the pre-approval grant.
    Grant storage grant = _getGrant(owner, grantId);
    // Ensure that the pre-approval matches the order.
    require(
      order.spender == grant.owner,
      "The specified pre-approval doesn't cover this spender."
    );
    require(
      order.recipient == grant.recipient,
      "The specified pre-approval doesn't cover this recipient."
    );
    require(
      order.amount <= grant.maxAmount,
      "The specified pre-approval doesn't cover for this amount."
    );
    // Update the pre-approval and render it invalid.
    invalidateGrant(grant, false);
    // Update the order status.
    updateOrder(order, ITransact.Status.Approved);
    // Make our token contract aware of the changes.
    reg.token().transferApproved(owner, order.recipient, order.amount);
    // Emit!
    emit Approval(owner, orderId);
  }

  /**
   * @dev This function approves a transfer. The transfer must be in the `ITransact.Status.Pending` status.
   * @notice For this to work, `msg.sender` must be a governor.
   * @param owner is the account to which the transfer belongs to.
   * @param orderId is the order ID that was returned by the `request` function to create the transfer order.
   */
  function approve(address owner, uint256 orderId) public governance isActor(owner) {
    // Get the order.
    Order storage order = _getOrder(owner, orderId);
    // Update the order status.
    updateOrder(order, ITransact.Status.Approved);
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
   * @param orderId is the order ID that was returned by the `request` function to create the transfer order.
   */
  function reject(address owner, uint256 orderId) public isActor(owner) {
    // Get the order.
    Order storage order = _getOrder(owner, orderId);
    address spender = order.spender;
    // Make sure that the caller is either a governor, or the owner of the
    // funds, or the person who made the transfer.
    require(
      reg.access().isGovernor(msg.sender) ||
      msg.sender == owner ||
      msg.sender == spender,
      "This function must be either called by a governor or by the transfer owner"
    );
    // Update the order.
    updateOrder(order, ITransact.Status.Rejected);
    // Make our token contract aware of the changes.
    reg.token().transferRejected(owner, spender, order.amount);
    // Emit!
    emit Rejection(owner, orderId);
  }

  // Private / internal stuff.

  function _getOrder(address owner, uint256 orderId) internal view returns(Order storage) {
    Order[] storage orders = orderBook[owner];
    require(orderId < orders.length, "The specified order id is invalid");
    return orders[orderId];
  }

  function _getGrant(address owner, uint256 grantId) internal view returns(Grant storage) {
    Grant[] storage grants = grantBook[owner];
    require(grantId < grants.length, "The specified pre-approval id is invalid");
    return grants[grantId];
  }

  /**
   * @dev This function updates a transfer. The transfer must be in the `Status.Pending` status.
   * @notice For this to work, `msg.sender` must be a governor.
   * @param order is the order to be updated.
   * @param status is the new status for the order.
   */
  function updateOrder(Order storage order, ITransact.Status status) internal {
    // Forbid operating on pending or 0 amount orders.
    require(order.status == ITransact.Status.Pending, "Cannot update a non-pending order");
    // Update the order.
    order.status = status;
  }

  /**
   * @dev This function updates a transfer. The transfer must be in the `Status.Pending` status.
   * @notice For this to work, `msg.sender` must be a governor.
   * @param order is the order to be updated.
   * @param status is the new status for the order.
   */
  function invalidateGrant(Grant storage grant) internal {
    // Forbid operating on pending or 0 amount orders.
    require(
      grant.valid == true,
      "The specified pre-approval was already rendered invalid"
    );
    // Update the order.
    grant.valid = false;
    _;
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
