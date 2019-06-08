pragma solidity >=0.4.21 <0.6.0;


contract Migrations {
  address public owner;
  uint public last_completed_migration;

  constructor() public {
    owner = msg.sender;
  }

  modifier restricted() {
    require(
      msg.sender == owner,
      "Only the owner of this contract shall call this method"
    );
    _;
  }

  function setCompleted(uint completed) public restricted {
    last_completed_migration = completed;
  }

  function upgrade(address addr) public restricted {
    Migrations upgraded = Migrations(addr);
    upgraded.setCompleted(last_completed_migration);
  }
}
