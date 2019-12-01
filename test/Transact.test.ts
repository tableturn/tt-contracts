import {
  AccessInstance,
  RegistryInstance,
  TransactInstance,
  TokenMockInstance
} from '../types/truffle-contracts';
import { assertNumberEquality } from './helpers/helpers';
import {
  DOUBLE_INIT,
  MUST_BE_GOVERNOR,
  INVALID_ORDER_INDEX,
  INVALID_ORDER,
  INVALID_ORDER_STATUS,
  OWNER_SAME_AS_RECIPIENT,
  INVALID_GRANT_INDEX,
  INVALID_GRANT,
  INVALID_GRANT_STATUS,
  GRANT_AMOUNT_MISMATCH,
  GRANT_RECIPIENT_MISMATCH,
  MUST_BE_TOKEN,
  MUST_BE_ACTOR,
  GRANT_OWNER_MISMATCH
} from './helpers/errors';
import { XferGrantStatus, XferOrderStatus, ONE, BAD_ID } from './helpers/constants';

const { itThrows } = require('./helpers/helpers');

const Registry = artifacts.require('Registry');
const Access = artifacts.require('Access');
const Transact = artifacts.require('Transact');
const TokenMock = artifacts.require('TokenMock');

contract('Transact', accounts => {
  const [_, governor, actor1, actor2, actor3, actor4, acc1, fakeToken] = accounts;
  const governance = { from: governor };
  var registry: RegistryInstance;
  var access: AccessInstance;
  var transact: TransactInstance;

  before(async () => {
    // Instanciate a few contracts.
    [access, registry] = await Promise.all([Access.new(), Registry.new()]);
    // Initialize various things.
    await Promise.all([access.initialize(governor), registry.initialize(access.address)]);
    // Setup contracts in our registry.
    await registry.setAccessContract(access.address, governance);
    // Set up 3 accounts as actors.
    Promise.all([actor1, actor2, actor3, actor4].map(actor => access.addActor(actor, governance)));
  });

  beforeEach(async () => {
    transact = await Transact.new();
    // Initialize the token and set the token contract in our registry.
    await Promise.all([
      transact.initialize(registry.address),
      registry.setTransactContract(transact.address, governance),
      registry.setTokenContract(fakeToken, governance)
    ]);
  });

  itThrows('initialize is called more than once', DOUBLE_INIT, async () => {
    await transact.initialize(registry.address, governance);
  });

  describe('request', async () => {
    itThrows('the owner is not an actor', MUST_BE_ACTOR, async () => {
      await transact.request(acc1, actor1, actor2, '1000', { from: fakeToken });
    });
    itThrows('the recipient is not an actor', MUST_BE_ACTOR, async () => {
      await transact.request(actor1, actor2, acc1, '1000', { from: fakeToken });
    });
    itThrows('the caller is not the Token contract', MUST_BE_TOKEN, async () => {
      await transact.request(actor1, actor1, actor2, '1000', governance);
    });

    it('creates a new order that can be queried', async () => {
      await transact.request(actor1, actor1, actor2, '1000', { from: fakeToken });
      const count = await transact.orderCount(actor1);
      assertNumberEquality(count, '1');
      const o = await transact.orderAt(actor1, '0');
      // Check that all fields of the order are correctly filled.
      assert.equal(o.spender, actor1);
      assert.equal(o.recipient, actor2);
      assertNumberEquality(o.amount, '1000');
      assertNumberEquality(o.status, XferOrderStatus.Pending);
    });

    it('adds the created order in both the owner and recipient books', async () => {
      await transact.request(actor1, actor2, actor3, '1000', { from: fakeToken });
      const [count1, count2, count3] = await Promise.all(
        [actor1, actor2, actor3].map(actor => transact.orderCount(actor))
      );
      [
        [count1, '1'],
        [count2, '0'],
        [count3, '1']
      ].map(([count, exp]) => assertNumberEquality(count, exp));
    });

    it('creates a new order id every time', async () => {
      await Promise.all(
        ['300', '700'].map(amount =>
          transact.request(actor1, actor1, actor2, amount, { from: fakeToken })
        )
      );
      const count = await transact.orderCount(actor1);
      assertNumberEquality(count, '2');
      const [id1, id2] = await Promise.all([
        transact.orderIdAt(actor1, '0'),
        transact.orderIdAt(actor1, '1')
      ]);
      assert.notEqual(id1, id2);
    });

    it('makes as many valid ids for as long as there are funds', async () => {
      const amounts = ['100', '200', '300', '400'];
      Promise.all(
        amounts.map(async amount => {
          await transact.request(actor1, actor1, actor2, amount, { from: fakeToken });
        })
      );
      // Check that 4 orders were made.
      const count = await transact.orderCount(actor1);
      assertNumberEquality(count, amounts.length);
      // Check that each order is of the correct amount.
      for (var i = 0; i < amounts.length; i++) {
        const o = await transact.orderAt(actor1, i);
        assertNumberEquality(o.amount, amounts[i]);
      }
    });
  });

  describe('order related methods', async () => {
    const fixtures = [
      { owner: actor1, spender: actor1, recipient: actor2, amount: '100' },
      { owner: actor1, spender: actor1, recipient: actor4, amount: '200' },
      { owner: actor2, spender: actor3, recipient: actor4, amount: '500' }
    ];

    beforeEach(async () => {
      await Promise.all(
        fixtures.map(({ owner, spender, recipient, amount }) =>
          transact.request(owner, spender, recipient, amount, { from: fakeToken })
        )
      );
    });

    describe('orderCount', async () => {
      it('returns the correct number of orders for a given owner', async () => {
        const [count1, count2, count3, count4] = await Promise.all(
          [actor1, actor2, actor3, actor4].map(actor => transact.orderCount(actor))
        );
        [
          [count1, '2'],
          [count2, '2'],
          [count3, '0'],
          [count4, '2']
        ].map(([count, exp]) => assertNumberEquality(count, exp));
      });
    });

    describe('orderIdAt', async () => {
      itThrows('given an invalid owner and index combination', INVALID_ORDER_INDEX, async () => {
        await transact.orderIdAt(actor1, '42');
      });
    });

    describe('orderAt', async () => {
      itThrows('given an invalid owner and index combination', INVALID_ORDER_INDEX, async () => {
        await transact.orderAt(actor1, '42');
      });

      it('succeeds with the correct parameters', async () => {
        const idx = (await transact.orderCount(actor2)).sub(ONE);
        const order = await transact.orderAt(actor2, idx);
        assert.equal(order.owner, actor2);
        assert.equal(order.spender, actor3);
        assert.equal(order.recipient, actor4);
        assertNumberEquality(order.amount, '500');
      });
    });

    describe('order', async () => {
      itThrows('provided id is invalid', INVALID_ORDER, async () => {
        await transact.order(BAD_ID);
      });

      it('succeeds with the correct parameters', async () => {
        const idx = (await transact.orderCount(actor2)).sub(ONE);
        const id = await transact.orderIdAt(actor2, idx);
        const order = await transact.order(id);
        assert.equal(order.owner, actor2);
        assert.equal(order.spender, actor3);
        assert.equal(order.recipient, actor4);
        assertNumberEquality(order.amount, '500');
      });
    });
  });

  describe('preapprove', async () => {
    itThrows('unauthorized', MUST_BE_GOVERNOR, async () => {
      await transact.preapprove(actor1, actor2, '1000');
    });
    itThrows('the owner is not an actor', MUST_BE_ACTOR, async () => {
      await transact.preapprove(acc1, actor2, '1000', governance);
    });
    itThrows('the recipient is not an actor', MUST_BE_ACTOR, async () => {
      await transact.preapprove(actor1, acc1, '1000', governance);
    });
    itThrows('the recipient is the same as the owner', OWNER_SAME_AS_RECIPIENT, async () => {
      await transact.preapprove(actor1, actor1, '1000', governance);
    });

    it('creates a new grant that can be queried', async () => {
      await transact.preapprove(actor1, actor2, '1000', governance);
      const count = await transact.grantCount(actor1);
      assertNumberEquality(count, '1');
      const id = count.sub(ONE);
      const g = await transact.grantAt(actor1, id);
      assertNumberEquality(g.maxAmount, '1000');
      assertNumberEquality(g.status, XferGrantStatus.Valid);
    });

    it('creates a new grant id every time', async () => {
      await Promise.all(
        ['300', '700'].map(amount => transact.preapprove(actor1, actor2, amount, governance))
      );
      const count = await transact.grantCount(actor1);
      assertNumberEquality(count, '2');
      const [id1, id2] = await Promise.all([
        transact.grantIdAt(actor1, '0'),
        transact.grantIdAt(actor1, '1')
      ]);
      assert.notEqual(id1, id2);
    });
  });

  describe('grant related methods', async () => {
    const fixtures = [
      { owner: actor1, recipient: actor2, amount: '100' },
      { owner: actor1, recipient: actor3, amount: '200' },
      { owner: actor2, recipient: actor3, amount: '500' }
    ];

    beforeEach(async () => {
      await Promise.all(
        fixtures.map(({ owner, recipient, amount }) =>
          transact.preapprove(owner, recipient, amount, governance)
        )
      );
    });

    describe('grantCount', async () => {
      it('returns the correct number of grants for a given owner', async () => {
        const [count1, count2, count3] = await Promise.all(
          [actor1, actor2, actor3].map(actor => transact.grantCount(actor))
        );
        [
          [count1, '2'],
          [count2, '1'],
          [count3, '0']
        ].map(([count, exp]) => assertNumberEquality(count, exp));
      });
    });

    describe('grantIdAt', async () => {
      itThrows('given an invalid owner and index combination', INVALID_GRANT_INDEX, async () => {
        await transact.grantIdAt(actor1, '42');
      });
    });

    describe('grantAt', async () => {
      itThrows('given an invalid owner and index combination', INVALID_GRANT_INDEX, async () => {
        await transact.grantAt(actor1, '42');
      });

      it('succeeds with the correct parameters', async () => {
        const idx = (await transact.grantCount(actor2)).sub(ONE);
        const grant = await transact.grantAt(actor2, idx);
        assert.equal(grant.owner, actor2);
        assert.equal(grant.recipient, actor3);
        assertNumberEquality(grant.maxAmount, '500');
      });
    });

    describe('grant', async () => {
      itThrows('provided id is invalid', INVALID_GRANT, async () => {
        await transact.grant(BAD_ID);
      });

      it('succeeds with the correct parameters', async () => {
        const idx = (await transact.grantCount(actor2)).sub(ONE);
        const id = await transact.grantIdAt(actor2, idx);
        const grant = await transact.grant(id);
        assert.equal(grant.owner, actor2);
        assert.equal(grant.recipient, actor3);
        assertNumberEquality(grant.maxAmount, '500');
      });
    });
  });

  describe('token callbacks', () => {
    let tokenMock: TokenMockInstance;
    let owner: string, spender: string, recipient: string;
    let orderId1: string, orderId2: string, orderId3: string;

    beforeEach(async () => {
      [owner, spender, recipient] = [actor1, actor2, actor3];
      Promise.all(
        ['1000', '1500', '2000'].map(amount =>
          transact.request(owner, spender, recipient, amount, { from: fakeToken })
        )
      );
      [orderId1, orderId2, orderId3] = await Promise.all(
        ['0', '1', '2'].map(index => transact.orderIdAt(owner, index))
      );
      tokenMock = await TokenMock.new();
      await registry.setTokenContract(tokenMock.address, governance);
    });

    describe('approve', async () => {
      itThrows('unauthorized', MUST_BE_GOVERNOR, async () => {
        await transact.approve(orderId1);
      });
      itThrows('order id is invalid', INVALID_ORDER, async () => {
        await transact.approve(BAD_ID, governance);
      });
      itThrows('called using a non-pending order', INVALID_ORDER_STATUS, async () => {
        await Promise.all([0, 1].map(() => transact.approve(orderId1, governance)));
      });

      it('marks the order as approved', async () => {
        await transact.approve(orderId1, governance);
        const { status } = await transact.order(orderId1);
        assertNumberEquality(status, XferOrderStatus.Approved);
      });
      it('notifies the Token contract via callback', async () => {
        const id = await transact.orderIdAt(owner, '0');
        await transact.approve(id, governance);
        const [{ owner: o, recipient: r, amount: a }] = await tokenMock.approvedCalls();
        assert.equal(o, owner);
        assert.equal(r, recipient);
        assertNumberEquality(a, '1000');
      });
    });

    describe('reject', async () => {
      itThrows('unauthorized', MUST_BE_GOVERNOR, async () => {
        const id = await transact.orderIdAt(owner, '0');
        await transact.reject(id);
      });
      itThrows('order id is invalid', INVALID_ORDER, async () => {
        await transact.reject(BAD_ID, governance);
      });
      itThrows('called using a non-pending order id', INVALID_ORDER_STATUS, async () => {
        const id = await transact.orderIdAt(owner, '0');
        await Promise.all([transact.reject(id, governance), transact.reject(id, governance)]);
      });

      it('marks the order as rejected', async () => {
        const id = await transact.orderIdAt(owner, '0');
        await transact.reject(id, governance);
        const { status } = await transact.orderAt(owner, '0');
        assertNumberEquality(status, XferOrderStatus.Rejected);
      });

      it('notifies the Token contract via callback', async () => {
        const id = await transact.orderIdAt(owner, '0');
        await transact.reject(id, governance);
        const [{ owner: o, spender: s, amount: a }] = await tokenMock.rejectedCalls();
        assert.equal(o, owner);
        assert.equal(s, spender);
        assertNumberEquality(a, '1000');
      });
    });

    describe('approveGranted', async () => {
      let grantId1: string;
      beforeEach(async () => {
        await transact.preapprove(owner, recipient, '1500', governance);
        grantId1 = await transact.grantIdAt(owner, '0');
      });

      itThrows('order cannot be found', INVALID_ORDER, async () => {
        await transact.approveGranted(BAD_ID, grantId1, { from: owner });
      });
      itThrows('grant cannot be found', INVALID_GRANT, async () => {
        await transact.approveGranted(orderId1, BAD_ID, { from: owner });
      });
      itThrows('called using a non-pending order', INVALID_ORDER_STATUS, async () => {
        await transact.approve(orderId1, governance);
        await transact.approveGranted(orderId1, grantId1, { from: owner });
      });
      itThrows('called using a non-pending grant', INVALID_GRANT_STATUS, async () => {
        await Promise.all(
          [orderId1, orderId2].map(orderId =>
            transact.approveGranted(orderId, grantId1, { from: owner })
          )
        );
      });
      itThrows('non-identical owners', GRANT_OWNER_MISMATCH, async () => {
        await transact.preapprove(actor2, recipient, '2000', governance);
        const grantId2 = await transact.grantIdAt(actor2, '0');
        await transact.approveGranted(orderId1, grantId2, { from: owner });
      });
      itThrows('non-identical recipients', GRANT_RECIPIENT_MISMATCH, async () => {
        await transact.preapprove(owner, actor4, '2000', governance);
        const grantId2 = await transact.grantIdAt(owner, '1');
        await transact.approveGranted(orderId1, grantId2, { from: owner });
      });
      itThrows('the grant does not cover', GRANT_AMOUNT_MISMATCH, async () => {
        await transact.approveGranted(orderId3, grantId1, { from: owner });
      });

      it('marks the order as approved and the grant as redeemed', async () => {
        await transact.approveGranted(orderId1, grantId1, { from: owner });
        const [o, g] = await Promise.all([
          transact.orderAt(owner, '0'),
          transact.grantAt(owner, '0')
        ]);
        assertNumberEquality(o.status, XferOrderStatus.Approved);
        assertNumberEquality(g.status, XferGrantStatus.Used);
      });
      it('notifies the Token contract via callback', async () => {
        await transact.approveGranted(orderId1, grantId1, { from: owner });
        const [{ owner: o, recipient: r, amount: a }] = await tokenMock.approvedCalls();
        assert.equal(o, owner);
        assert.equal(r, recipient);
        assertNumberEquality(a, '1000');
      });
    });
  });
});
