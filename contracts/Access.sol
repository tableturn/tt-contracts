pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import '@openzeppelin/upgrades/contracts/Initializable.sol';
import './interfaces/IAccess.sol';
import './lib/AddressSetLib.sol';


/**
contract * @title Access
 * @dev Enforces that only certain enrolled members can perform certain actions.
 */
contract Access is Initializable, IAccess {
  using AddressSetLib for AddressSetLib.Data;

  struct Flags {
    bool isIssuer;
    bool isGovernor;
    bool isActor;
  }

  AddressSetLib.Data issuerList;
  AddressSetLib.Data governorList;
  AddressSetLib.Data actorList;

  /// Events.

  event GovernorAdded(address indexed governor);
  event GovernorRemoved(address indexed governor);
  event IssuerAdded(address indexed issuer);
  event IssuerRemoved(address indexed issuer);
  event ActorAdded(address indexed actor);
  event ActorRemoved(address indexed actor);

  /// Public stuff.

  /**
   * @dev ZOS constructor.
   * @param governor is the initial governor over the system.
   */
  function initialize(address governor) external initializer {
    governorList.add(governor);
  }

  /// Issuance.

  /**
   * @dev Retrieves the list of issuers.
   * @return the list of addresses considered issuers.
   */
  function issuers() external view returns (address[] memory) {
    return issuerList.values;
  }

  /**
   * @dev Determines whether a given address is an issuer or not.
   * @param c is an address to test for issuance belonging.
   * @return a boolean.
   */
  function isIssuer(address c) public view returns (bool) {
    return issuerList.contains(c);
  }

  /**
   * @dev Adds an address to the list of issuers.
   * @param a is the address to be added as issuer.
   */
  function addIssuer(address a) public governance {
    issuerList.add(a);
    emit IssuerAdded(a);
  }

  /**
   * @dev Removes an issuer from the issuers list.
   * @param a is the address of the issuer to be removed.
   */
  function removeIssuer(address a) public governance {
    issuerList.remove(a);
    emit IssuerRemoved(a);
  }

  /// Governance.

  /**
   * @dev Retrieves the list of governors.
   * @return the list of addresses considered governors.
   */
  function governors() external view returns (address[] memory) {
    return governorList.values;
  }

  /**
   * @dev Determines whether a given address is a governor or not.
   * @param c is an address to test for governance belonging.
   * @return a boolean.
   */
  function isGovernor(address c) public view returns (bool) {
    return governorList.contains(c);
  }

  /**
   * @dev Adds an address to the governance list.
   * @param a is the address to be added as governor.
   */
  function addGovernor(address a) public governance {
    governorList.add(a);
    emit GovernorAdded(a);
  }

  /**
   * @dev Removes a governor from the governance list.
   * @param a is the address of the governor to be removed.
   */
  function removeGovernor(address a) public governance {
    require(msg.sender != a, 'Cannot self-destruct as a governor');
    governorList.remove(a);
    emit GovernorRemoved(a);
  }

  /// Actors.

  /**
   * @dev Retrieves the list of actors.
   * @return the list of addresses considered actors.
   */
  function actors() external view returns (address[] memory) {
    return actorList.values;
  }

  /**
   * @dev Determines whether a given address is an actor or not.
   * @param c is an address to test for acting belonging.
   * @return a boolean.
   */
  function isActor(address c) public view returns (bool) {
    return actorList.contains(c);
  }

  /**
   * @dev Adds an address to the actors list.
   * @param a is the address to be added as an actor.
   */
  function addActor(address a) public governance {
    actorList.add(a);
    emit ActorAdded(a);
  }

  /**
   * @dev Removes an actor from the actors list.
   * @param a is the address of the actor to be removed.
   */
  function removeActor(address a) public governance {
    actorList.remove(a);
    emit ActorRemoved(a);
  }

  /**
   * @dev Gets all flags at once.
   * @param a is the address to be checked.
   * @return a `Flags` structure.
   */
  function flags(address a) public view returns (Flags memory) {
    return
      Flags({isIssuer: this.isIssuer(a), isGovernor: this.isGovernor(a), isActor: this.isActor(a)});
  }

  /**
   * @dev Sets all flags for a given address at once.
   * @param a is the address to set flags for.
   * @param flags is a `Flags` instance describing the new flags to be set.
   */
  function setFlags(address a, Flags calldata flags) external governance {
    if (this.isIssuer(a) != flags.isIssuer) {
      flags.isIssuer ? addIssuer(a) : removeIssuer(a);
    }
    if (this.isGovernor(a) != flags.isGovernor) {
      flags.isGovernor ? addGovernor(a) : removeGovernor(a);
    }
    if (this.isActor(a) != flags.isActor) {
      flags.isActor ? addActor(a) : removeActor(a);
    }
  }

  // Modifiers.

  modifier governance {
    require(governorList.contains(msg.sender), 'This function must be called by a governor');
    _;
  }
}
