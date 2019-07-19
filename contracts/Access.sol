pragma solidity ^0.5.9;
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "./interfaces/IAccess.sol";
import "./lib/AddressSet.sol";


/**
contract * @title Access
 * @dev Enforces that only certain enrolled members can perform certain actions.
 */
contract Access is Initializable, IAccess {
  using AddressSet for AddressSet.Set;

  AddressSet.Set issuerList;
  AddressSet.Set governorList;
  AddressSet.Set actorList;

  /// Events.

  event GovernorAdded(address indexed governor);
  event GovernorRemoved(address indexed governor);
  event IssuerAdded(address indexed issuer);
  event IssuerRemoved(address indexed issuer);
  event ActorAdded(address indexed actor);

  /// Public stuff.

  /**
   * @dev ZOS constructor.
   * @param governor is the initial governor over the system.
   */
  function initialize(address governor) public initializer {
    governorList.add(governor);
  }

  /// Issuance.

  /**
   * @dev Retrieves the list of issuers.
   * @return the list of addresses considered issuers.
   */
  function issuers() public view returns(address[] memory) {
    return issuerList.values;
  }

  /**
   * @dev Determines whether a given address is an issuer or not.
   * @param c is an address to test for issuance belonging.
   * @return a boolean.
   */
  function isIssuer(address c) public view returns(bool) {
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
  function governors() public view returns(address[] memory) {
    return governorList.values;
  }

  /**
   * @dev Determines whether a given address is a governor or not.
   * @param c is an address to test for governance belonging.
   * @return a boolean.
   */
  function isGovernor(address c) public view returns(bool) {
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
    require(
      msg.sender != a,
      "Cannot self-destruct as a governor"
    );
    governorList.remove(a);
    emit GovernorRemoved(a);
  }

  /// Actors.

  /**
   * @dev Retrieves the list of actors.
   * @return the list of addresses considered actors.
   */
  function actors() public view returns(address[] memory) {
    return actorList.values;
  }

  /**
   * @dev Determines whether a given address is an actor or not.
   * @param c is an address to test for acting belonging.
   * @return a boolean.
   */
  function isActor(address c) public view returns(bool) {
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

  // Modifiers.

  modifier governance {
    require(
      governorList.contains(msg.sender),
      "This function must be called by a governor"
    );
    _;
  }
}
