import BN = require('bn.js');

export const XferGrantStatus = {
  Valid: new BN(0),
  Used: new BN(1)
};

export const XferOrderStatus = {
  Pending: new BN(0),
  Approved: new BN(1),
  Rejected: new BN(2)
};
