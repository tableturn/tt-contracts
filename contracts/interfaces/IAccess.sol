// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


interface IAccess {
  /**
   * @dev Determines whether a given address is an issuer or not.
   * @param c is an address to test for issuance belonging.
   * @return a boolean.
   */
  function isIssuer(address c) external view returns (bool);

  /**
   * @dev Determines whether a given address is a governor or not.
   * @param c is an address to test for governance belonging.
   * @return a boolean.
   */
  function isGovernor(address c) external view returns (bool);

  /**
   * @dev Determines whether a given address is an actor or not.
   * @param c is an address to test for acting belonging.
   * @return a boolean.
   */
  function isActor(address c) external view returns (bool);

  /**
   * @dev Determines whether a given address is an automaton or not.
   * @param c is an address to test for automaton belonging.
   * @return a boolean.
   */
  function isAutomaton(address c) external view returns (bool);
}
