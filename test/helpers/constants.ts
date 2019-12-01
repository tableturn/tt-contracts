import BN = require('bn.js');

export const ZERO = new BN(0);
export const ONE = new BN(1);
export const TWO = new BN(2);
export const THREE = new BN(3);

export const BAD_ID = '0x0000000000000000000000000000000000000000000000000000000000000000';

export const XferGrantStatus = {
  Valid: ZERO,
  Used: ONE
};

export const XferOrderStatus = {
  Pending: ZERO,
  Approved: ONE,
  Rejected: TWO
};
