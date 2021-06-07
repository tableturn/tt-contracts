// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


/**
 * @dev Interface of the ERC1404 standard as defined in the EIP.
 */
interface IERC1404 {
  /**
   * @dev Returns a transfer restriction error code if the transfer shoudln't be permitted,
   *      or otherwise returns zero if everything looks fine.
   * @param owner is the account from which the tokens should be transfered.
   * @param recipient is the target of the transfer.
   * @param amount is the amount to be transfered.
   * @return a uint8 error code if a problem was detected, otherwise zero.
   */
  function detectTransferRestriction(address owner, address recipient, uint256 amount)
    external
    view
    returns (uint8);

  /**
   * @dev Maps a transfer restriction error code into a human-readable string.
   * @param code is the code that should be transformed into a string.
   * @return A string that describes the given error code.
   */
  function messageForTransferRestriction(uint8 code) external pure returns (string memory);
}
