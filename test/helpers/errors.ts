export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const DOUBLE_INIT = 'Contract instance has already been initialized';
export const MUST_BE_ISSUER = 'This function must be called by an issuer';
export const MUST_BE_ACTOR = 'Provided account is not an actor';
export const MUST_BE_GOVERNOR = 'This function must be called by a governor';
export const INVALID_ORDER_ID = 'The specified order id is invalid';
export const INVALID_ORDER_STATUS = 'Cannot update a non-pending order';
export const INVALID_GRANT_ID = 'The specified grant id is invalid';
export const INVALID_GRANT_STATUS = 'Cannot redeem an already invalid grant';
export const GRANT_RECIPIENT_MISMATCH = "The specified pre-approval doesn't cover this recipient";
export const GRANT_AMOUNT_MISMATCH = "The specified pre-approval doesn't cover for this amount";

export const MUST_BE_TRANSACT = 'This function can only be called by the Transact contract';
export const MUST_BE_TOKEN = 'This function can only be called by the Token contract';

export const INVALID_ZERO_ADDRESS = 'Address cannot be 0x0';
export const ADDRESS_ALREADY_IN_SET = 'Address already in set';
export const NONEXISTENT_ADDRESS = 'Address does not exist in set';

export const HASH_ALREADY_IN_SET = 'Hash already in set';
export const NONEXISTENT_HASH = 'Hash does not exist in set';

export const INSUFFICIENT_FUNDS = 'Insufficient funds';
export const INSUFFICIENT_FROZEN_FUNDS = 'Insufficient frozen funds';
export const INSUFFICIENT_ALLOWANCE = 'Insufficient allowance from owner';

export const SAME_RECIPIENT = 'Recipient cannot be the same as owner';
export const SELF_ALLOWANCE = 'Cannot perform a transfer using allowance on behalf of yourself';

export const DUPLICATED_ADDRESS = 'Address already in set';
export const DUPLICATED_HASH = 'Hash already in set';
export const SELF_TERMINATION = 'Cannot self-destruct as a governor';
export const ADDITION_OVERFLOW = 'SafeMath: addition overflow';

export const CANNOT_RETRIEVE_FROZEN = 'Cannot retrieve dead tokens on an account with frozen funds';
