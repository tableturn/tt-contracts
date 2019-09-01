pragma solidity ^0.5.9;
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "./interfaces/IAccess.sol";
import "./interfaces/IRegister.sol";
import "./interfaces/ITransact.sol";
import "./interfaces/IToken.sol";


/**
 * @title App
 * @dev Allows to register new versions of contracts and provides a registry.
 */
contract Registry is Initializable {
  IAccess public access;
  IRegister public register;
  ITransact public transact;
  IToken public token;

  /**
   * @dev ZOS constructor.
   */
  function initialize(IAccess _access) public initializer {
    access = _access;
  }

  function setAccessContract(IAccess _access) public governance {
    access = _access;
  }

  function setRegisterContract(IRegister _register) public governance {
    register = _register;
  }

  function setTransactContract(ITransact _transact) public governance {
    transact = _transact;
  }

  function setTokenContract(IToken _token) public governance {
    token = _token;
  }

  // Modifiers.

  modifier governance {
    require(
      access.isGovernor(msg.sender),
      "This function must be called by a governor"
    );
    _;
  }
}
