pragma solidity ^0.5.9;
// Libraries.
import "./lib/HashSet.sol";
// Interfaces and Contracts.
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "./interfaces/IRegister.sol";
import "./Registry.sol";


contract Register is Initializable, IRegister {
  using HashSet for HashSet.Set;
  /// @dev This is our contract registry.
  Registry public reg;
  HashSet.Set hashList;

  // Public functions.

  /**
   * @dev This is the ZOS constructor.
   * @param _reg is a valid Registry contract to use for other contract calls.
   */
  function initialize(Registry _reg) public initializer {
    reg = _reg;
  }

  function hashAndAdd(bytes memory what) public governance {
    addHash(keccak256(what));
  }

  function addHash(bytes32 h) public governance {
    hashList.add(h);
  }

  function containsHashOf(bytes memory what) public view returns(bool) {
    return containsHash(keccak256(what));
  }

  function containsHash(bytes32 h) public view returns(bool) {
    return hashList.contains(h);
  }

  // Modifiers.

  modifier governance() {
    require(
      reg.access().isGovernor(msg.sender),
      "This function must be called by a governor"
    );
    _;
  }
}
