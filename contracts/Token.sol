// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
// Interfaces and Contracts.
import '@openzeppelin/upgrades/contracts/Initializable.sol';
import './interfaces/IERC20.sol';
import './interfaces/IERC1404.sol';
import './interfaces/IToken.sol';
import './interfaces/ITransact.sol';
import './lib/AccountLib.sol';
import './Registry.sol';
import './Transact.sol';


contract Token is Initializable, IToken, IERC20, IERC1404 {
  using AccountLib for AccountLib.Data;

  /// --- Events.

  event Issuance(uint256 amount, string reason);

  /// --- Members.

  /// @dev This is our contract registry.
  Registry public reg;

  /// @dev The total amount of tokens owned by actors, excluding the reserve.
  uint256 public override totalSupply;

  /// @dev Our accounts are held in this mapping.
  mapping(address => AccountLib.Data) accounts;
  mapping(address => mapping(address => uint256)) allowances;

  /// --- Constants.

  // These are transfer restriction codes that can be returned by
  // the detection function.
  uint8 public constant ERRC_OWNER_NOT_ACTOR = 1;
  uint8 public constant ERRC_RECIPIENT_NOT_ACTOR = 2;
  uint8 public constant ERRC_OWNER_SAME_AS_RECIPIENT = 3;

  // Error messages that can be mapped from a transfer restriction detection
  // error code.
  string public constant ERR_OWNER_NOT_ACTOR = 'Owner of funds must be an actor';
  string public constant ERR_RECIPIENT_NOT_ACTOR = 'Recipient of funds must be an actor';
  string public constant ERR_OWNER_SAME_AS_RECIPIENT = 'Recipient cannot be the same as owner';

  address private constant ZERO_ADDRESS = address(0);
  address private constant RESERVE_ADDRESS = ZERO_ADDRESS;

  /// --- Public functions, mostly ERC20 related.

  /**
   * @dev This is the ZOS constructor.
   * @param pReg is a valid Registry contract to use for other contract calls.
   */
  function initialize(Registry pReg) external initializer {
    reg = pReg;
  }

  function symbol() external pure returns (string memory) {
    return 'CVD';
  }

  function name() external pure returns (string memory) {
    return 'Consilience Ventures Digital Share';
  }

  function decimals() external pure returns (uint8) {
    return 6;
  }

  /**
   * @dev This function returns the liquid amount of tokens for a given account.
   * @param account is the address to check the balance of.
   * @return The liquid balance of the given account.
   */
  function balanceOf(address account) external view override returns (uint256) {
    return accounts[account].liquid;
  }

  /**
   * @dev This function returns the frozen amount of tokens for a given account.
   * @param account is the address to check the balance of.
   * @return The frozen balance of the given account.
   */
  function frozenOf(address account) external view returns (uint256) {
    return accounts[account].frozen;
  }

  /**
   * @dev This function is to be called by the issuers to create new tokens to later be allocated
   *      to actors.
   * @param amount is how many tokens should be allocated.
   */
  function issue(uint256 amount, string calldata reason) external issuance {
    accounts[RESERVE_ADDRESS].credit(amount);
    emit Issuance(amount, reason);
  }

  /**
   * @dev This function allocates new tokens from the reserve into an account. Note that
   *      the recipient must be a valid actor before this call can be made.
   * @param recipient is the actor who will receive the funds.
   * @param amount is how many tokens should be allocated.
   */
  function allocate(address recipient, uint256 amount)
    external
    governance
    isRecipientActor(recipient) {
    totalSupply += amount;
    // We perform the same operation as a regular transfer, except that the owner is the reserve.
    accounts[RESERVE_ADDRESS].freeze(amount);
    // This request is performed by the governor on behalf of the reserve.
    reg.transact().request(RESERVE_ADDRESS, msg.sender, recipient, amount, 'Allocation from Reserve');
  }

  /// --- ERC20 functions.

  /**
   * @dev Initiates a token transfer between two accounts.
   * @notice To work, `msg.sender` must be the owner of the account.
   * @param recipient is the account that will be credited.
   * @param amount is the quantity of tokens to transfer from the owner account.
   * @return A bool value set to true signaling a successful operation.
   */
  function transfer(address recipient, uint256 amount)
    public override
    isOwnerActor(msg.sender)
    isRecipientActor(recipient)
    ownerAndRecipientDifferent(msg.sender, recipient)
    isPositive(amount)
    returns (bool) {
    address owner = msg.sender;
    accounts[owner].freeze(amount);
    reg.transact().request(owner, owner, recipient, amount, 'Unspecified');
    return true;
  }

  /**
   * @dev Same as `transfer` but with an additional reference.
   */
  function transferWithReference(address recipient, uint256 amount, string calldata ref)
    external
    isOwnerActor(msg.sender)
    isRecipientActor(recipient)
    ownerAndRecipientDifferent(msg.sender, recipient)
    isPositive(amount)
    returns (bool) {
    address owner = msg.sender;
    accounts[owner].freeze(amount);
    reg.transact().request(owner, owner, recipient, amount, ref);
    return true;
  }

  /**
   * @dev Immediatelly transfers tokens between two accounts using an allowance, eg
   *      when the spender isn't the owner of the tokens. This method requires that an allowance
   *      was set using the `approve` function.
   * @notice To work, `msg.sender` must be the allowed spender.
   * @param owner is the account owning the funds, eg on behalf of which the transfer will be made.
   * @param recipient is the account that will be credited.
   * @param amount is the quantity of tokens to transfer from the owner account.
   * @return A bool value set to true signaling a successful operation.
   */
  function transferFrom(address owner, address recipient, uint256 amount)
    external override
    isOwnerActor(owner)
    isRecipientActor(recipient)
    ownerAndRecipientDifferent(owner, recipient)
    isPositive(amount)
    returns (bool) {
    // We're transacting on behalf of someone. The owner and spender should be different.
    require(msg.sender != owner, 'Cannot perform a transfer using allowance on behalf of yourself');
    uint256 allowed = allowances[owner][msg.sender];
    require(amount <= allowed, 'Insufficient allowance from owner');
    _approve(owner, msg.sender, allowed - amount);
    accounts[owner].freeze(amount);
    reg.transact().request(owner, msg.sender, recipient, amount, 'Unspecified');
    return true;
  }

  /**
   * @dev The same as `transferFrom` but with an additional reference.
   */
  function transferFromWithReference(address owner, address recipient, uint256 amount, string calldata ref)
    external
    isOwnerActor(owner)
    isRecipientActor(recipient)
    ownerAndRecipientDifferent(owner, recipient)
    isPositive(amount)
    returns (bool) {
    // We're transacting on behalf of someone. The owner and spender should be different.
    require(msg.sender != owner, 'Cannot perform a transfer using allowance on behalf of yourself');
    uint256 allowed = allowances[owner][msg.sender];
    require(amount <= allowed, 'Insufficient allowance from owner');
    _approve(owner, msg.sender, allowed - amount);
    accounts[owner].freeze(amount);
    reg.transact().request(owner, msg.sender, recipient, amount, ref);
    return true;
  }

  /**
   * @dev Approves an allowance for a given spender account.
   * @notice To work, `msg.sender` must be the owner of the account.
   * @param spender is the account that will be allowed to spend the funds.
   * @param amount is the quantity of tokens to allow the spender to spend.
   * @return A bool value set to true signaling a successful operation.
   */
  function approve(address spender, uint256 amount) external override returns (bool) {
    _approve(msg.sender, spender, amount);
    return true;
  }

  /**
   * @dev Retrieves the allowance that was granted from a given owner to a spender.
   * @param owner is the account owning the funds.
   * @param spender is the account for which to check the allowance for..
   * @return A number representing the allowance from the owner account to the spender account.
   */
  function allowance(address owner, address spender) external view override returns (uint256) {
    return allowances[owner][spender];
  }

  /// --- ERC1404 functions.

  function detectTransferRestriction(address owner, address recipient, uint256)
    external view override returns (uint8) {
    IAccess access = reg.access();
    if (!access.isActor(owner)) {
      return ERRC_OWNER_NOT_ACTOR;
    } else if (!access.isActor(recipient)) {
      return ERRC_RECIPIENT_NOT_ACTOR;
    } else if (owner == recipient) {
      return ERRC_OWNER_SAME_AS_RECIPIENT;
    } else {
      return 0;
    }
  }

  function messageForTransferRestriction(uint8 errCode)
    external pure override returns (string memory) {
    if (errCode == ERRC_OWNER_NOT_ACTOR) return ERR_OWNER_NOT_ACTOR;
    else if (errCode == ERRC_RECIPIENT_NOT_ACTOR) return ERR_RECIPIENT_NOT_ACTOR;
    else if (errCode == ERRC_OWNER_SAME_AS_RECIPIENT) return ERR_OWNER_SAME_AS_RECIPIENT;
    else revert('Unknown transfer restriction error code');
  }

  /// --- Public but app functions.

  /**
   * @dev This function is a callback that should only be used from the Transact contract after a
   *      transfer order was approved.
   * @param owner is the account owning the funds, eg on behalf of which the transfer will be made.
   * @param recipient is the account that shall receive the funds.
   * @param amount is the quantity of tokens to transfer from the owner account.
   */
  function transferApproved(address owner, address recipient, uint256 amount)
    external override
    fromTransact {
    accounts[owner].unfreeze(accounts[recipient], amount);
    emit IERC20.Transfer(owner, recipient, amount);
  }

  /**
   * @dev This function is a callback and is called exclusivelly by the Transact contract.
   *      It reverts a transfer order by thawing the funds on the owner account and crediting
   *      them back on the owner liquid balance. If the transfer was made by allowance, it
   *      restores that allowance to the spender.
   * @param owner is the account owning the funds.
   * @param spender is the account performing the operation. It could be the same as `owner`.
   * @param amount is the quantity of tokens to transfer from the owner account.
   */
  function transferRejected(address owner, address spender, uint256 amount)
  external override
  fromTransact {
    if (owner != spender) {
      _approve(owner, spender, allowances[owner][spender] + amount);
    }
    accounts[owner].unfreeze(accounts[owner], amount);
  }

  /**
   * @dev Allows the retrieval of dead tokens - eg tokens that were transfered to a lost account.
   *      This function is deprecated will be removed soon.
   * @param owner is the account owning the funds.
   * @param target is the account that should be credited.
   */
  function retrieveDeadTokens(address owner, address target)
    external
    governance()
    isOwnerActor(owner)
    isRecipientActor(target) {
    require(
      accounts[owner].frozen == 0,
      'Cannot retrieve dead tokens on an account with frozen funds'
    );
    accounts[owner].transfer(accounts[target], accounts[owner].liquid);
  }

  // Internal and private.

  /**
   * @dev Immediatelly approves a spender to use funds from an owner account.
   * @notice To work, `msg.sender` must be the owner of the account.
   * @param owner is the account from which the spender will draw from.
   * @param spender is the account that will be allowed to spend the funds on behalf of the owner.
   * @param amount is the quantity of tokens that the spender can spend at most.
   */
  function _approve(address owner, address spender, uint256 amount) internal isOwnerActor(owner) {
    allowances[owner][spender] = amount;
    emit IERC20.Approval(owner, spender, amount);
  }

  // Modifiers.

  modifier issuance() {
    require(reg.access().isIssuer(msg.sender), 'This function must be called by an issuer');
    _;
  }

  modifier governance() {
    require(reg.access().isGovernor(msg.sender), 'This function must be called by a governor');
    _;
  }

  modifier isOwnerActor(address c) {
    require(reg.access().isActor(c), ERR_OWNER_NOT_ACTOR);
    _;
  }

  modifier isRecipientActor(address c) {
    require(reg.access().isActor(c), ERR_RECIPIENT_NOT_ACTOR);
    _;
  }

  modifier ownerAndRecipientDifferent(address a, address b) {
    require(a != b, ERR_OWNER_SAME_AS_RECIPIENT);
    _;
  }

  modifier fromTransact() {
    require(
      msg.sender == address(reg.transact()),
      'This function can only be called by the Transact contract'
    );
    _;
  }

  modifier isPositive(uint256 amount) {
    require(amount > 0, 'Amount cannot be zero');
    _;
  }
}
