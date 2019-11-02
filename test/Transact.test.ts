import BN from 'bn.js';
import {
  AccessInstance,
  RegistryInstance,
  TransactInstance,
  TokenMockInstance
} from '../types/truffle-contracts';
import { assertNumberEquality } from './helpers/helpers';
import {
  DOUBLE_INIT,
  MUST_BE_ACTOR,
  MUST_BE_GOVERNOR,
  INVALID_ORDER_ID,
  INVALID_ORDER_STATUS,
  SAME_RECIPIENT,
  INVALID_GRANT_ID,
  INVALID_GRANT_STATUS,
  GRANT_AMOUNT_MISMATCH,
  GRANT_RECIPIENT_MISMATCH
} from './helpers/errors';
import { XferGrantStatus, XferOrderStatus } from './helpers/constants';

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
    itThrows('the recipient is the same as the owner', SAME_RECIPIENT, async () => {
      await transact.preapprove(actor1, actor1, '1000', governance);
    });

    it('creates a new grant that can be queried', async () => {
      await transact.preapprove(actor1, actor2, '1000', governance);
      const count = await transact.countGrants(actor1);
      assertNumberEquality(count, '1');
      const id = count.sub(new BN(1));
      const g = await transact.getGrant(actor1, id);
      assertNumberEquality(g.maxAmount, '1000');
      assertNumberEquality(g.status, XferGrantStatus.Valid);
    });
  });

  describe('countGrants', async () => {
    it('returns the correct number of grants for a given owner', async () => {
      await transact.preapprove(actor1, actor2, '100', governance);
      await transact.preapprove(actor1, actor3, '200', governance);
      await transact.preapprove(actor1, actor4, '300', governance);
      assertNumberEquality(await transact.countGrants(actor1), '3');
    });
  });

  describe('allGrants', async () => {
    it('allows to retrieve all grants at once', async () => {
      await Promise.all(
        [
          { actor: actor1, amount: '50' },
          { actor: actor2, amount: '100' },
          { actor: actor2, amount: '150' },
          { actor: actor3, amount: '200' },
          { actor: actor3, amount: '250' },
          { actor: actor3, amount: '300' }
        ].map(({ actor, amount }) => transact.preapprove(actor, actor4, amount, governance))
      );

      [
        { actor: actor1, count: '1' },
        { actor: actor2, count: '2' },
        { actor: actor3, count: '3' },
        { actor: actor4, count: '0' }
      ].map(async ({ actor, count }) => {
        const [c, o] = await Promise.all([transact.countGrants(actor), transact.allGrants(actor)]);
        assertNumberEquality(c, count);
        assert.lengthOf(o, Number.parseInt(count));
      });
    });
  });

  describe('request', async () => {
    itThrows('the owner is not an actor', MUST_BE_ACTOR, async () => {
      await transact.request(acc1, actor1, actor2, '1000', { from: fakeToken });
    });
    itThrows('the recipient is not an actor', MUST_BE_ACTOR, async () => {
      await transact.request(actor1, actor2, acc1, '1000', { from: fakeToken });
    });

    it('creates a new order that can be queried', async () => {
      await transact.request(actor1, actor1, actor2, '1000', { from: fakeToken });
      const count = await transact.countOrders(actor1);
      assertNumberEquality(count, '1');
      const id = count.sub(new BN(1));
      const o = await transact.getOrder(actor1, id);
      // Check that all fields of the order are correctly filled.
      assert.equal(o.spender, actor1);
      assert.equal(o.recipient, actor2);
      assertNumberEquality(o.amount, '1000');
      assertNumberEquality(o.status, XferOrderStatus.Pending);
    });

    it('allows to retrieve all orders at once', async () => {
      await Promise.all(
        [
          { actor: actor1, amount: '50' },
          { actor: actor2, amount: '100' },
          { actor: actor2, amount: '150' },
          { actor: actor3, amount: '200' },
          { actor: actor3, amount: '250' },
          { actor: actor3, amount: '300' }
        ].map(
          async ({ actor, amount }) =>
            await transact.request(actor, actor, actor4, amount, { from: fakeToken })
        )
      );

      [
        { actor: actor1, count: '1' },
        { actor: actor2, count: '2' },
        { actor: actor3, count: '3' },
        { actor: actor4, count: '0' }
      ].map(async ({ actor, count }) => {
        const [c, o] = await Promise.all([transact.countOrders(actor), transact.allOrders(actor)]);
        assertNumberEquality(c, count);
        assert.lengthOf(o, Number.parseInt(count));
      });
    });

    it('makes as many valid ids for as long as there are funds', async () => {
      const amounts = ['100', '200', '300', '400'];
      Promise.all(
        amounts.map(async amount => {
          await transact.request(actor1, actor1, actor2, amount, { from: fakeToken });
        })
      );
      // Check that 4 orders were made.
      const count = await transact.countOrders(actor1);
      assertNumberEquality(count, amounts.length);
      // Check that each order is of the correct amount.
      for (var i = 0; i < amounts.length; i++) {
        const o = await transact.getOrder(actor1, i);
        assertNumberEquality(o.amount, amounts[i]);
      }
    });
  });

  describe('countOrders', async () => {
    it('returns the correct number of orders for a given owner', async () => {
      const fixture = [
        { owner: actor1, spender: actor1, recipient: actor2, amount: '100' },
        { owner: actor1, spender: actor1, recipient: actor3, amount: '200' },
        { owner: actor1, spender: actor2, recipient: actor4, amount: '300' }
      ];
      await Promise.all(
        fixture.map(({ owner, spender, recipient, amount }) =>
          transact.request(owner, spender, recipient, amount, { from: fakeToken })
        )
      );
      assertNumberEquality(await transact.countOrders(actor1), fixture.length);
    });
  });

  describe('allOrders', async () => {
    it('allows to retrieve all orders at once', async () => {
      const fixture = [
        { actor: actor1, amount: '50' },
        { actor: actor2, amount: '100' },
        { actor: actor2, amount: '150' },
        { actor: actor3, amount: '200' },
        { actor: actor3, amount: '250' },
        { actor: actor3, amount: '300' }
      ];
      await Promise.all(
        fixture.map(({ actor, amount }) =>
          transact.request(actor, actor, actor4, amount, { from: fakeToken })
        )
      );

      [
        { actor: actor1, count: '1' },
        { actor: actor2, count: '2' },
        { actor: actor3, count: '3' },
        { actor: actor4, count: '0' }
      ].map(async ({ actor, count }) => {
        const [c, o] = await Promise.all([transact.countOrders(actor), transact.allOrders(actor)]);
        assertNumberEquality(c, count);
        assert.lengthOf(o, Number.parseInt(count));
      });
    });
  });

  describe('token callbacks', () => {
    let tokenMock: TokenMockInstance;
    let owner: string, spender: string, recipient: string;

    beforeEach(async () => {
      [owner, spender, recipient] = [actor1, actor2, actor3];
      Promise.all([
        transact.request(owner, spender, recipient, '1000', { from: fakeToken }),
        transact.request(owner, spender, recipient, '1500', { from: fakeToken }),
        transact.request(owner, spender, recipient, '2000', { from: fakeToken })
      ]);
      tokenMock = await TokenMock.new();
      await registry.setTokenContract(tokenMock.address, governance);
    });

    describe('approve', async () => {
      itThrows('unauthorized', MUST_BE_GOVERNOR, async () => {
        await transact.approve(owner, '0');
      });
      itThrows('order cannot be found', INVALID_ORDER_ID, async () => {
        await transact.approve(owner, '42', governance);
      });
      itThrows('called using a non-pending order', INVALID_ORDER_STATUS, async () => {
        await transact.approve(owner, '0', governance);
        await transact.approve(owner, '0', governance);
      });

      it('marks the order as approved', async () => {
        await transact.approve(owner, '0', governance);
        const { status } = await transact.getOrder(owner, '0');
        assertNumberEquality(status, XferOrderStatus.Approved);
      });
      it('notifies the Token contract via callback', async () => {
        await transact.approve(owner, '0', governance);
        const [{ owner: o, recipient: r, amount: a }] = await tokenMock.approvedCalls();
        assert.equal(o, owner);
        assert.equal(r, recipient);
        assertNumberEquality(a, '1000');
      });
    });

    describe('reject', async () => {
      itThrows('unauthorized', MUST_BE_GOVERNOR, async () => {
        await transact.reject(owner, '0');
      });
      itThrows('order cannot be found', INVALID_ORDER_ID, async () => {
        await transact.reject(owner, '42', governance);
      });
      itThrows('called using a non-pending order id', INVALID_ORDER_STATUS, async () => {
        await transact.reject(owner, '0', governance);
        await transact.reject(owner, '0', governance);
      });

      it('marks the order as rejected', async () => {
        await transact.reject(owner, '0', governance);
        const { status } = await transact.getOrder(owner, '0');
        assertNumberEquality(status, XferOrderStatus.Rejected);
      });

      it('notifies the Token contract via callback', async () => {
        await transact.reject(owner, '0', governance);
        const [{ owner: o, spender: s, amount: a }] = await tokenMock.rejectedCalls();
        assert.equal(o, owner);
        assert.equal(s, spender);
        assertNumberEquality(a, '1000');
      });
    });

    describe('approveGranted', async () => {
      beforeEach(async () => {
        await transact.preapprove(owner, recipient, '1500', governance);
      });

      itThrows('order cannot be found', INVALID_ORDER_ID, async () => {
        await transact.approveGranted(owner, '42', '0', { from: owner });
      });
      itThrows('grant cannot be found', INVALID_GRANT_ID, async () => {
        await transact.approveGranted(owner, '0', '42', { from: owner });
      });
      itThrows('called using a non-pending order', INVALID_ORDER_STATUS, async () => {
        await transact.approve(owner, '0', governance);
        await transact.approveGranted(owner, '0', '0', { from: owner });
      });
      itThrows('called using a non-pending grant', INVALID_GRANT_STATUS, async () => {
        await transact.approveGranted(owner, '0', '0', { from: owner });
        await transact.approveGranted(owner, '1', '0', { from: owner });
      });
      itThrows('the grant recipient does not match', GRANT_RECIPIENT_MISMATCH, async () => {
        await transact.preapprove(owner, actor4, '2000', governance);
        await transact.approveGranted(owner, '0', '1', { from: owner });
      });
      itThrows('the grant does not cover', GRANT_AMOUNT_MISMATCH, async () => {
        await transact.approveGranted(owner, '2', '0', { from: owner });
      });

      it('marks the order as approved and the grant as redeemed', async () => {
        await transact.approveGranted(owner, '0', '0', { from: owner });
        const [o, g] = await Promise.all([
          transact.getOrder(owner, '0'),
          transact.getGrant(owner, '0')
        ]);
        assertNumberEquality(o.status, XferOrderStatus.Approved);
        assertNumberEquality(g.status, XferGrantStatus.Used);
      });
      it('notifies the Token contract via callback', async () => {
        await transact.approveGranted(owner, '0', '0', { from: owner });
        const [{ owner: o, recipient: r, amount: a }] = await tokenMock.approvedCalls();
        assert.equal(o, owner);
        assert.equal(r, recipient);
        assertNumberEquality(a, '1000');
      });
    });
  });
});
