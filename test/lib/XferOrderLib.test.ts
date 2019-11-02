import { XferOrderLibTesterInstance } from '../../types/truffle-contracts';
import { assertNumberEquality, itThrows } from '../helpers/helpers';
import { INVALID_ORDER_STATUS } from '../helpers/errors';
import { XferOrderStatus } from '../helpers/constants';

const XferOrderLibTester = artifacts.require('XferOrderLibTester');

contract('XferOrderLib', accounts => {
  const [_, spender, recipient] = accounts;
  let tester: XferOrderLibTesterInstance;

  before(async () => {
    tester = await XferOrderLibTester.new();
  });

  describe('make', async () => {
    it('creates an object with its fields set properly', async () => {
      const sample1 = await tester.make(spender, recipient, '100');
      assert.equal(sample1.spender, spender);
      assert.equal(sample1.recipient, recipient);
      assertNumberEquality(sample1.amount, '100');
      assertNumberEquality(sample1.status, XferOrderStatus.Pending);
    });
  });

  describe('finalize', async () => {
    itThrows(' already approved', INVALID_ORDER_STATUS, async () => {
      await tester.setSample1(spender, recipient, '100', '42', XferOrderStatus.Approved);
      await tester.finalize(XferOrderStatus.Pending);
    });
    itThrows(' already rejected', INVALID_ORDER_STATUS, async () => {
      await tester.setSample1(spender, recipient, '100', '42', XferOrderStatus.Approved);
      await tester.finalize(XferOrderStatus.Pending);
    });
    it('sets status to whatever is passed', async () => {
      await tester.setSample1(spender, recipient, '100', '42', XferOrderStatus.Pending);
      const before = await tester.getSample1();
      assertNumberEquality(before.status, XferOrderStatus.Pending);
      await tester.finalize(XferOrderStatus.Approved);
      const after = await tester.getSample1();
      assertNumberEquality(after.status, XferOrderStatus.Approved);
    });
  });

  describe('approve', async () => {
    itThrows(' already approved', INVALID_ORDER_STATUS, async () => {
      await tester.setSample1(spender, recipient, '100', '42', XferOrderStatus.Approved);
      await tester.approve();
    });
    itThrows(' already rejected', INVALID_ORDER_STATUS, async () => {
      await tester.setSample1(spender, recipient, '100', '42', XferOrderStatus.Approved);
      await tester.approve();
    });

    it('sets status to approved', async () => {
      await tester.setSample1(spender, recipient, '100', '42', XferOrderStatus.Pending);
      const before = await tester.getSample1();
      assertNumberEquality(before.status, XferOrderStatus.Pending);
      await tester.approve();
      const after = await tester.getSample1();
      assertNumberEquality(after.status, XferOrderStatus.Approved);
    });
  });

  describe('reject', async () => {
    itThrows(' already approved', INVALID_ORDER_STATUS, async () => {
      await tester.setSample1(spender, recipient, '100', '42', XferOrderStatus.Approved);
      await tester.reject();
    });
    itThrows(' already rejected', INVALID_ORDER_STATUS, async () => {
      await tester.setSample1(spender, recipient, '100', '42', XferOrderStatus.Approved);
      await tester.reject();
    });

    it('sets status to rejected', async () => {
      await tester.setSample1(spender, recipient, '100', '42', XferOrderStatus.Pending);
      const before = await tester.getSample1();
      assertNumberEquality(before.status, XferOrderStatus.Pending);
      await tester.reject();
      const after = await tester.getSample1();
      assertNumberEquality(after.status, XferOrderStatus.Rejected);
    });
  });
});
