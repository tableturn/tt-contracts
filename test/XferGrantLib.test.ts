import { XferGrantLibTesterInstance } from '../types/truffle-contracts';
import { assertNumberEquality, itThrows } from './helpers';
import { INVALID_GRANT_STATUS } from './errors';
import { XferGrantStatus } from './constants';

const XferGrantLibTester = artifacts.require('XferGrantLibTester');

contract('XferGrantLib', accounts => {
  const [_, recipient] = accounts;
  let tester: XferGrantLibTesterInstance;

  before(async () => {
    tester = await XferGrantLibTester.new();
  });

  describe('make', async () => {
    it('creates an object with its fields set properly', async () => {
      const sample1 = await tester.make(recipient, '300');
      assert.equal(sample1.recipient, recipient);
      assertNumberEquality(sample1.maxAmount, '300');
      assertNumberEquality(sample1.status, XferGrantStatus.Valid);
    });
  });

  describe('redeem', async () => {
    itThrows(' already redeemed', INVALID_GRANT_STATUS, async () => {
      await tester.setSample1(recipient, '300', XferGrantStatus.Used);
      await tester.redeem();
    });

    it('sets status to used', async () => {
      await tester.setSample1(recipient, '200', XferGrantStatus.Valid);
      const before = await tester.getSample1();
      assertNumberEquality(before.status, XferGrantStatus.Valid);
      await tester.redeem();
      const after = await tester.getSample1();
      assertNumberEquality(after.status, XferGrantStatus.Used);
    });
  });
});
