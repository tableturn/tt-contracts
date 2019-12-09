pragma solidity ^0.5.9;
// Libraries.
import "./lib/HashSetLib.sol";
// Interfaces and Contracts.
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "./interfaces/IRegister.sol";
import "./Registry.sol";


contract Register is Initializable, IRegister {
  using HashSetLib for HashSetLib.Data;
  /// @dev This is our contract registry.
  Registry public reg;
  HashSetLib.Data hashList;

  // Public functions.

  /**
   * @dev This is the ZOS constructor.
   * @param pReg is a valid Registry contract to use for other contract calls.
   */
  function initialize(Registry pReg) external initializer {
    reg = pReg;
  }

  /// @dev Hashes and adds `what` to the table.
  function hashAndAdd(bytes calldata what) external governance {
    addHash(keccak256(what));
  }

  /// @dev Checks the table for the presence of the hash of `what`.
  function containsHashOf(bytes calldata what) external view returns(bool) {
    return containsHash(keccak256(what));
  }

  /// @dev Checks the table for the presence of `what`.
  function containsHash(bytes32 h) public view returns(bool) {
    return hashList.contains(h);
  }

  /// @dev Adds `what` to the table.
  function addHash(bytes32 h) public governance {
    hashList.add(h);
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
