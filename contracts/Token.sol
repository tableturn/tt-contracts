pragma solidity ^0.5.9;
// Libraries.
import "@openzeppelin/contracts/math/SafeMath.sol";
// Interfaces and Contracts.
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "./interfaces/IToken.sol";
import "./lib/AccountLib.sol";
import "./Registry.sol";
import "./Transact.sol";


contract Token is Initializable, IToken, IERC20 {
  using SafeMath for uint256;
  using AccountLib for AccountLib.Data;

  /// --- Events.

  event Issuance(uint256 amount, string reason);

  /// --- Members.

  /// @dev This is our contract registry.
  Registry public reg;

  /// @dev The total amount of tokens owned by actors, excluding the reserve.
  uint256 public totalSupply;

  /// @dev Our accounts are held in this mapping.
  mapping (address => AccountLib.Data) accounts;
  mapping (address => mapping (address => uint256)) allowances;

  /// --- Constants.

  // These are transfer restriction codes that can be returned by
  // the detection function.
  uint8 constant ERRC_OWNER_NOT_ACTOR = 1;
  uint8 constant ERRC_RECIPIENT_NOT_ACTOR = 2;
  uint8 constant ERRC_OWNER_SAME_AS_RECIPIENT = 3;

  // Error messages that can be mapped from a transfer restriction detection
  // error code.
  string constant ERR_OWNER_NOT_ACTOR = "Owner of funds must be an actor";
  string constant ERR_RECIPIENT_NOT_ACTOR = "Recipient of funds must be an actor";
  string constant ERR_OWNER_SAME_AS_RECIPIENT = "Recipient cannot be the same as owner";

  /// --- Public functions, mostly ERC20 related.

  /**
   * @dev This is the ZOS constructor.
   * @param _reg is a valid Registry contract to use for other contract calls.
   */
  function initialize(Registry _reg) public initializer {
    reg = _reg;
  }

  function symbol() public pure returns(string memory) { return "CVD"; }
  function name() public pure returns(string memory) { return "Consilience Ventures Digital Share"; }
  function decimals() public pure returns(uint8) { return 6; }

  /**
   * @dev This function returns the liquid amount of tokens for a given account.
   * @param account is the address to check the balance of.
   * @return The liquid balance of the given account.
   */
  function balanceOf(address account) public view returns(uint256) {
    return accounts[account].liquid;
  }

  /**
   * @dev This function returns the frozen amount of tokens for a given account.
   * @param account is the address to check the balance of.
   * @return The frozen balance of the given account.
   */
  function frozenOf(address account) public view returns(uint256) {
    return accounts[account].frozen;
  }

  /**
   * @dev This function is to be called by the issuers to create new tokens to later be allocated
   *      to actors.
   * @param amount is how many tokens should be allocated.
   */
  function issue(uint256 amount, string memory reason) public issuance {
    accounts[address(0)].credit(amount);
    emit Issuance(amount, reason);
  }

  /**
   * @dev This function allocates new tokens from the reserve into an account. Note that
   *      the recipient must be a valid actor before this call can be made.
   * @param recipient is the actor who will receive the funds.
   * @param amount is how many tokens should be allocated.
   */
  function allocate(address recipient, uint256 amount) public governance isRecipientActor(recipient) {
    totalSupply = totalSupply.add(amount);
    accounts[address(0)].debit(amount);
    accounts[recipient].credit(amount);
    emit IERC20.Transfer(address(0), recipient, amount);
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
    public isOwnerActor(msg.sender)
           isRecipientActor(recipient)
           ownerAndRecipientDifferent(msg.sender, recipient)
  returns(bool)
  {
    address owner = msg.sender;
    accounts[owner].freeze(amount);
    reg.transact().request(
      owner,
      owner,
      recipient,
      amount
    );
    return true;
  }

  /**
   * @dev Immediatelly transfers tokens between two accounts using an allowance, eg the
   *      when the spender isn't the owner of the tokens. This method requires that an allowance
   *      was set using the `approve` function.
   * @notice To work, `msg.sender` must be the allowed spender.
   * @param owner is the account owning the funds, eg on behalf of which the transfer will be made.
   * @param recipient is the account that will be credited.
   * @param amount is the quantity of tokens to transfer from the owner account.
   * @return A bool value set to true signaling a successful operation.
   */
  function transferFrom(address owner, address recipient, uint256 amount)
    public isOwnerActor(owner)
           isRecipientActor(recipient)
           ownerAndRecipientDifferent(owner, recipient)
  returns(bool)
  {
    // We're transacting on behalf of someone. The owner and spender should be different.
    require(msg.sender != owner, "Cannot perform a transfer using allowance on behalf of yourself");
    address spender = msg.sender;
    uint256 allowed = allowances[owner][spender];
    require(amount <= allowed, "Insufficient allowance from owner");
    _approve(owner, spender, allowed.sub(amount));
    accounts[owner].freeze(amount);
    reg.transact().request(
      owner,
      spender,
      recipient,
      amount
    );
    return true;
  }

  /**
   * @dev Approves an allowance for a given spender account.
   * @notice To work, `msg.sender` must be the owner of the account.
   * @param spender is the account that will be allowed to spend the funds.
   * @param amount is the quantity of tokens to allow the spender to spend.
   * @return A bool value set to true signaling a successful operation.
   */
  function approve(address spender, uint256 amount) public returns(bool) {
    address owner = msg.sender;
    _approve(owner, spender, amount);
    return true;
  }

  /**
   * @dev Retrieves the allowance that was granted from a given owner to a spender.
   * @param owner is the account owning the funds.
   * @param spender is the account for which to check the allowance for..
   * @return A number representing the allowance from the owner account to the spender account.
   */
  function allowance(address owner, address spender) public view returns(uint256) {
    return allowances[owner][spender];
  }

  /// --- ERC1404 functions.

  /// --- Public but app functions.

  /**
   * @dev This function is a callback that should only be used from the Transact contract after a
   *      transfer order was approved.
   * @param owner is the account owning the funds, eg on behalf of which the transfer will be made.
   * @param recipient is the account that shall receive the funds.
   * @param amount is the quantity of tokens to transfer from the owner account.
   */
  function transferApproved(address owner, address recipient, uint256 amount) public fromTransact {
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
  function transferRejected(address owner, address spender, uint256 amount) public fromTransact {
    if (owner != spender) {
      _approve(owner, spender, allowances[owner][spender].add(amount));
    }
    accounts[owner].unfreeze(accounts[owner], amount);
  }

  /**
   * @dev Allows the retrieval of dead tokens - eg tokens that were transfered to a lost account.
   *      This function is deprecated will be removed soon.
   * @param owner is the account owning the funds.
   * @param target is the account that should be credited.
   */
  function retrieveDeadTokens(address owner, address target) public governance() isOwnerActor(owner) isRecipientActor(target) {
    require(
      accounts[owner].frozen == 0,
      "Cannot retrieve dead tokens on an account with frozen funds"
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
    require(
      reg.access().isIssuer(msg.sender),
      "This function must be called by an issuer"
    );
    _;
  }

  modifier governance() {
    require(
      reg.access().isGovernor(msg.sender),
      "This function must be called by a governor"
    );
    _;
  }

  modifier isActor(address c) {
    require(
      reg.access().isActor(c),
      "Provided account is not an actor"
    );
    _;
  }

  modifier isOwnerActor(address c) {
    require(
      reg.access().isActor(c),
      ERR_OWNER_NOT_ACTOR
    );
    _;
  }

  modifier isRecipientActor(address c) {
    require(
      reg.access().isActor(c),
      ERR_RECIPIENT_NOT_ACTOR
    );
    _;
  }

  modifier ownerAndRecipientDifferent(address a, address b) {
    require(
      a != b,
      ERR_OWNER_SAME_AS_RECIPIENT
    );
    _;
  }

  modifier fromTransact() {
    require(
      msg.sender == address(reg.transact()),
      "This function can only be called by the Transact contract"
    );
    _;
  }
}
