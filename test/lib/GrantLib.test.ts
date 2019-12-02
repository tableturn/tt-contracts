import { GrantLibTesterInstance } from '../../types/truffle-contracts';
import { assertNumberEquality, itThrows, makeId } from '../helpers/helpers';
import { INVALID_GRANT, INVALID_GRANT_STATUS, ZERO_ADDRESS } from '../helpers/errors';
import { XferGrantStatus } from '../helpers/constants';

const GrantLibTester = artifacts.require('GrantLibTester');

contract('GrantLib', accounts => {
  const [_, owner, recipient] = accounts;
  let t: GrantLibTesterInstance;

  before(async () => {
    t = await GrantLibTester.new();
  });

  describe('make', async () => {
    it('creates an object with its fields set properly', async () => {
      const sample1 = await t.make(makeId(), owner, recipient, '300');
      assert.equal(sample1.recipient, recipient);
      assertNumberEquality(sample1.maxAmount, '300');
      assertNumberEquality(sample1.status, XferGrantStatus.Valid);
    });
  });

  describe('redeem', async () => {
    itThrows(' already redeemed', INVALID_GRANT_STATUS, async () => {
      await t.setSample1(makeId(), owner, recipient, '300', XferGrantStatus.Used);
      await t.redeem();
    });

    it('sets status to used', async () => {
      await t.setSample1(makeId(), owner, recipient, '200', XferGrantStatus.Valid);
      const before = await t.getSample1();
      assertNumberEquality(before.status, XferGrantStatus.Valid);
      await t.redeem();
      const after = await t.getSample1();
      assertNumberEquality(after.status, XferGrantStatus.Used);
    });
  });

  describe('ensureValidStruct', async () => {
    itThrows('the grant owner is invalid', INVALID_GRANT, async () => {
      await t.setSample1(makeId(), ZERO_ADDRESS, recipient, '50', XferGrantStatus.Valid);
      await t.ensureValidStruct();
    });
    itThrows('the grant recipient is invalid', INVALID_GRANT, async () => {
      await t.setSample1(makeId(), owner, ZERO_ADDRESS, '50', XferGrantStatus.Used);
      await t.ensureValidStruct();
    });
    itThrows('the grant amount is invalid', INVALID_GRANT, async () => {
      await t.setSample1(makeId(), owner, recipient, '0', XferGrantStatus.Valid);
      await t.ensureValidStruct();
    });

    it('succeeds when the grant is valid', async () => {
      await t.setSample1(makeId(), owner, recipient, '50', XferGrantStatus.Used);
      await t.ensureValidStruct();
      assert.isTrue(true);
    });
  });
});
