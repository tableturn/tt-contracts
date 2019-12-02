import { OrderLibTesterInstance } from '../../types/truffle-contracts';
import { assertNumberEquality, itThrows } from '../helpers/helpers';
import { INVALID_ORDER, INVALID_ORDER_STATUS, ZERO_ADDRESS } from '../helpers/errors';
import { XferOrderStatus } from '../helpers/constants';

const OrderLibTester = artifacts.require('OrderLibTester');

contract('OrderLib', accounts => {
  const [_, owner, spender, recipient] = accounts;
  let t: OrderLibTesterInstance;

  before(async () => {
    t = await OrderLibTester.new();
  });

  describe('create', async () => {
    it('creates an object with its fields set properly', async () => {
      const sample1 = await t.make(owner, spender, recipient, '100');
      assert.equal(sample1.spender, spender);
      assert.equal(sample1.recipient, recipient);
      assertNumberEquality(sample1.amount, '100');
      assertNumberEquality(sample1.status, XferOrderStatus.Pending);
    });
  });

  describe('finalize', async () => {
    itThrows(' already approved', INVALID_ORDER_STATUS, async () => {
      await t.setSample1(owner, spender, recipient, '100', '42', XferOrderStatus.Approved);
      await t.finalize(XferOrderStatus.Pending);
    });
    itThrows(' already rejected', INVALID_ORDER_STATUS, async () => {
      await t.setSample1(owner, spender, recipient, '100', '42', XferOrderStatus.Approved);
      await t.finalize(XferOrderStatus.Pending);
    });
    it('sets status to whatever is passed', async () => {
      await t.setSample1(owner, spender, recipient, '100', '42', XferOrderStatus.Pending);
      const before = await t.getSample1();
      assertNumberEquality(before.status, XferOrderStatus.Pending);
      await t.finalize(XferOrderStatus.Approved);
      const after = await t.getSample1();
      assertNumberEquality(after.status, XferOrderStatus.Approved);
    });
  });

  describe('approve', async () => {
    itThrows(' already approved', INVALID_ORDER_STATUS, async () => {
      await t.setSample1(owner, spender, recipient, '100', '42', XferOrderStatus.Approved);
      await t.approve();
    });
    itThrows(' already rejected', INVALID_ORDER_STATUS, async () => {
      await t.setSample1(owner, spender, recipient, '100', '42', XferOrderStatus.Approved);
      await t.approve();
    });

    it('sets status to approved', async () => {
      await t.setSample1(owner, spender, recipient, '100', '42', XferOrderStatus.Pending);
      const before = await t.getSample1();
      assertNumberEquality(before.status, XferOrderStatus.Pending);
      await t.approve();
      const after = await t.getSample1();
      assertNumberEquality(after.status, XferOrderStatus.Approved);
    });
  });

  describe('reject', async () => {
    itThrows(' already approved', INVALID_ORDER_STATUS, async () => {
      await t.setSample1(owner, spender, recipient, '100', '42', XferOrderStatus.Approved);
      await t.reject();
    });
    itThrows(' already rejected', INVALID_ORDER_STATUS, async () => {
      await t.setSample1(owner, spender, recipient, '100', '42', XferOrderStatus.Approved);
      await t.reject();
    });

    it('sets status to rejected', async () => {
      await t.setSample1(owner, spender, recipient, '100', '42', XferOrderStatus.Pending);
      const before = await t.getSample1();
      assertNumberEquality(before.status, XferOrderStatus.Pending);
      await t.reject();
      const after = await t.getSample1();
      assertNumberEquality(after.status, XferOrderStatus.Rejected);
    });
  });

  describe('ensureValidStruct', async () => {
    itThrows('the owner is invalid', INVALID_ORDER, async () => {
      await t.setSample1(ZERO_ADDRESS, spender, recipient, '50', '42', XferOrderStatus.Approved);
      await t.ensureValidStruct();
    });
    itThrows('the spender is invalid', INVALID_ORDER, async () => {
      await t.setSample1(owner, ZERO_ADDRESS, recipient, '50', '42', XferOrderStatus.Pending);
      await t.ensureValidStruct();
    });
    itThrows('the recipient is invalid', INVALID_ORDER, async () => {
      await t.setSample1(owner, spender, ZERO_ADDRESS, '50', '42', XferOrderStatus.Approved);
      await t.ensureValidStruct();
    });
    itThrows('the amount is invalid', INVALID_ORDER, async () => {
      await t.setSample1(owner, spender, recipient, '0', '42', XferOrderStatus.Approved);
      await t.ensureValidStruct();
    });

    it('succeeds when the grant is valid', async () => {
      await t.setSample1(owner, spender, recipient, '50', '42', XferOrderStatus.Rejected);
      await t.ensureValidStruct();
      assert.isTrue(true);
    });
  });
});
