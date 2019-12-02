pragma solidity ^0.5.9;
import "./GrantLib.sol";


library XferGrantLib {
  using XferGrantLib for Data;
  using GrantLib for GrantLib.Grant;

  /// @dev Represents a transfer grant - a pre-approval ahead of time.
  struct Data {
    mapping(bytes32 => GrantLib.Grant) grants;
    mapping(address => bytes32[]) ids;
  }

  function create(
    Data storage data,
    address owner,
    address recipient,
    uint256 maxAmount
  ) internal returns(bytes32)
  {
    require(owner != recipient, "Recipient cannot be the same as owner");
    // Get the owner order book.
    bytes32[] storage ids = data.ids[owner];
    // Make a new order id.
    bytes32 id = generateId(owner, ids.length);
    // Add the grant id to the owner grant book.
    ids.push(id);
    // Add the order to the global order queue.
    data.grants[id] = GrantLib.make(
      id,
      owner,
      recipient,
      maxAmount
    );
    return id;
  }

  /// @dev Creates an order id.
  function generateId(address owner, uint256 index) internal pure returns(bytes32) {
    return keccak256(abi.encodePacked("Order", owner, index));
  }

  /// @dev Counts received grants for a given account.
  function count(Data storage data, address owner) internal view returns(uint256) {
    return data.ids[owner].length;
  }

  /// @dev Retrieves a grant id given its owner and its index.
  function idByOwnerAndIndex(Data storage data, address owner, uint256 index) internal view returns(bytes32) {
    bytes32[] storage ids = data.ids[owner];
    require(
      index < ids.length,
      "The specified grant index is invalid"
    );
    return ids[index];
  }

  /// @dev Retrieves a grant given its owner and its index.
  function byOwnerAndIndex(Data storage data, address owner, uint256 index) internal view returns(GrantLib.Grant storage) {
    return data.grants[data.idByOwnerAndIndex(owner, index)];
  }

  /// @dev Retrieves a grant given its id.
  function byId(Data storage data, bytes32 id) internal view returns(GrantLib.Grant storage) {
    GrantLib.Grant storage g = data.grants[id];
    g.ensureValidStruct();
    return g;
  }
}
