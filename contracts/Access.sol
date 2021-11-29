// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

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
    bool isAutomaton;
  }

  AddressSetLib.Data issuerList;
  AddressSetLib.Data governorList;
  AddressSetLib.Data actorList;
  AddressSetLib.Data automatonList;

  /// Events.

  event GovernorAdded(address indexed governor);
  event GovernorRemoved(address indexed governor);
  event IssuerAdded(address indexed issuer);
  event IssuerRemoved(address indexed issuer);
  event ActorAdded(address indexed actor);
  event ActorRemoved(address indexed actor);
  event AutomatonAdded(address indexed automaton);
  event AutomatonRemoved(address indexed automaton);

  /// Public stuff.

  /**
   * @dev ZOS constructor.
   * @param governor is the initial governor over the system.
   */
  function initialize(address governor) external initializer {
    actorList.add(address(0));
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
  function isIssuer(address c) public view override returns (bool) {
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
   * @dev Removes an issuer from the issuer list.
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
  function isGovernor(address c) public view override returns (bool) {
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
    require(msg.sender != a, 'Cannot self-destruct');
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
  function isActor(address c) public view override returns (bool) {
    return actorList.contains(c);
  }

  /**
   * @dev Adds an address to the actor list.
   * @param a is the address to be added as an actor.
   */
  function addActor(address a) public governanceOrAutomation {
    actorList.add(a);
    emit ActorAdded(a);
  }

  /**
   * @dev Removes an actor from the actor list.
   * @param a is the address of the actor to be removed.
   */
  function removeActor(address a) public governance {
    actorList.remove(a);
    emit ActorRemoved(a);
  }

  /// Automatons.

  /**
   * @dev Retrieves the list of automatons.
   * @return the list of addresses considered automatons.
   */
  function automatons() external view returns (address[] memory) {
    return automatonList.values;
  }

  /**
   * @dev Determines whether a given address is an automaton or not.
   * @param c is an address to test for automaton belonging.
   * @return a boolean.
   */
  function isAutomaton(address c) public view override returns (bool) {
    return automatonList.contains(c);
  }

  /**
   * @dev Adds an address to the automaton list.
   * @param a is the address to be added as an automaton.
   */
  function addAutomaton(address a) public governance {
    automatonList.add(a);
    emit AutomatonAdded(a);
  }

  /**
   * @dev Removes an actor from the automaton list.
   * @param a is the address of the automaton to be removed.
   */
  function removeAutomaton(address a) public governance {
    automatonList.remove(a);
    emit AutomatonRemoved(a);
  }

  /// Flags.

  /**
   * @dev Gets all flags at once.
   * @param a is the address to be checked.
   * @return a `Flags` structure.
   */
  function flags(address a) public view returns (Flags memory) {
    return
      Flags({
        isIssuer: this.isIssuer(a),
        isGovernor: this.isGovernor(a),
        isActor: this.isActor(a),
        isAutomaton: this.isAutomaton(a)
      });
  }

  /**
   * @dev Sets all flags for a given address at once.
   * @param a is the address to set flags for.
   * @param _flags is a `Flags` instance describing the new flags to be set.
   */
  function setFlags(address a, Flags calldata _flags) external governance {
    if (isIssuer(a) != _flags.isIssuer) {
      _flags.isIssuer ? addIssuer(a) : removeIssuer(a);
    }
    if (isGovernor(a) != _flags.isGovernor) {
      _flags.isGovernor ? addGovernor(a) : removeGovernor(a);
    }
    if (isActor(a) != _flags.isActor) {
      _flags.isActor ? addActor(a) : removeActor(a);
    }
    if (isAutomaton(a) != _flags.isAutomaton) {
      _flags.isAutomaton ? addAutomaton(a) : removeAutomaton(a);
    }
  }

  // Modifiers.

  modifier governance {
    require(governorList.contains(msg.sender), 'This function must be called by a governor');
    _;
  }

  modifier governanceOrAutomation {
    require(
      governorList.contains(msg.sender) || automatonList.contains(msg.sender),
      'This function must be called by a governor or an automaton.'
    );
    _;
  }
}
