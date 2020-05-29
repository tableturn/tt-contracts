pragma solidity >=0.4.21 <0.6.0;


contract Migrations {
  address public owner;
  uint256 public lastCompletedMigration;

  constructor() public {
    owner = msg.sender;
  }

  modifier restricted() {
    require(msg.sender == owner, 'Only the owner of this contract shall call this method');
    _;
  }

  function setCompleted(uint256 completed) external restricted {
    lastCompletedMigration = completed;
  }

  function upgrade(address addr) external restricted {
    Migrations upgraded = Migrations(addr);
    upgraded.setCompleted(lastCompletedMigration);
  }
}
