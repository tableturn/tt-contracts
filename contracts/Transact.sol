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

  /// Events.

  event Request(address indexed owner, uint256 id);
  event Approval(address indexed owner, uint256 id);
  event Rejection(address indexed owner, uint256 id);

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
   * @return The transfer id that was created.
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

  function get(address owner, uint256 id) public view returns(Order memory) {
    return _get(owner, id);
  }

  /**
   * @dev This function approves a transfer. The transfer must be in the `ITransact.Status.Pending` status.
   * @notice For this to work, `msg.sender` must be a governor.
   * @param owner is the account to which the transfer belongs to.
   * @param id is the identifier that was returned by the `request` function to create the transfer order.
   */
  function approve(address owner, uint256 id) public governance isActor(owner) {
    // Get the order.
    Order storage order = _get(owner, id);
    // Update the order.
    updateOrder(order, ITransact.Status.Approved);
    // Make our token contract aware of the changes.
    reg.token().transferApproved(owner, order.recipient, order.amount);
    // Emit!
    emit Approval(owner, id);
  }

  /**
   * @dev This function rejects a transfer. The transfer must be in the `ITransact.Status.Pending` status.
   *      The function can be called either by a governor or the owner of the funds.
   * @notice For this to work, `msg.sender` must be a governor.
   * @param owner is the account to which the transfer belongs to.
   * @param id is the identifier that was returned by the `request` function to create the transfer order.
   */
  function reject(address owner, uint256 id) public isActor(owner) {
    // Get the order.
    Order storage order = _get(owner, id);
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
    emit Rejection(owner, id);
  }

  // Private / internal stuff.

  function _get(address owner, uint256 id) internal view returns(Order storage) {
    Order[] storage orders = orderBook[owner];
    require(id < orders.length, "The specified order id is invalid");
    return orders[id];
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
