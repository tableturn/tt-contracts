// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import '@openzeppelin/upgrades/contracts/Initializable.sol';
import './interfaces/IAccess.sol';
import './interfaces/IRegister.sol';
import './interfaces/ITransact.sol';
import './interfaces/IToken.sol';


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
  function initialize(IAccess pAccess) external initializer {
    access = pAccess;
  }

  function setAccessContract(IAccess pAccess) external governance {
    access = pAccess;
  }

  function setRegisterContract(IRegister pRegister) external governance {
    register = pRegister;
  }

  function setTransactContract(ITransact pTransact) external governance {
    transact = pTransact;
  }

  function setTokenContract(IToken pToken) external governance {
    token = pToken;
  }

  // Modifiers.

  modifier governance {
    require(access.isGovernor(msg.sender), 'This function must be called by a governor');
    _;
  }
}
