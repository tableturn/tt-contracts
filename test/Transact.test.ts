import BN from 'bn.js';
import {
  AccessInstance,
  RegistryInstance,
  TransactInstance,
  TokenMockInstance
} from '../types/truffle-contracts';
import { assertNumberEquality } from './helpers';
import {
  DOUBLE_INIT,
  MUST_BE_ACTOR,
  MUST_BE_GOVERNOR,
  INVALID_ORDER_ID,
  INVALID_ORDER_STATUS,
  MUST_BE_GOV_OR_ORDERER
} from './errors';

const { itThrows } = require('./helpers');

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
    Promise.all(
      [actor1, actor2, actor3, actor4].map(async actor => await access.addActor(actor, governance))
    );
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

    it('creates a new order that can be queried', async () => {
      await transact.request(actor1, actor1, actor2, '1000', { from: fakeToken });
      const count = await transact.count(actor1);
      assertNumberEquality(count, '1');
      const id = count.sub(new BN(1));
      const o = await transact.get(actor1, id);
      // Check that all fields of the order are correctly filled.
      assert.equal(o.spender, actor1);
      assert.equal(o.recipient, actor2);
      assertNumberEquality(o.amount, '1000');
      assertNumberEquality(o.status, '0');
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
        const [c, o] = await Promise.all([transact.count(actor), transact.all(actor)]);
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
      const count = await transact.count(actor1);
      assertNumberEquality(count, amounts.length);
      // Check that each order is of the correct amount.
      for (var i = 0; i < amounts.length; i++) {
        const o = await transact.get(actor1, i);
        assertNumberEquality(o.amount, amounts[i]);
      }
    });
  });

  describe('functions that require a token callback', () => {
    var tokenMock: TokenMockInstance;
    var owner: string, spender: string, recipient: string;

    beforeEach(async () => {
      [owner, spender, recipient] = [actor1, actor2, actor3];
      await transact.request(owner, spender, recipient, '1000', { from: fakeToken });
      tokenMock = await TokenMock.new();
      await registry.setTokenContract(tokenMock.address, governance);
    });

    describe('approve', async () => {
      itThrows('unauthorized', MUST_BE_GOVERNOR, async () => {
        await transact.approve(owner, 0);
      });
      itThrows('request cannot be found', INVALID_ORDER_ID, async () => {
        await transact.approve(owner, '42', governance);
      });
      itThrows('called using a non-pending order id', INVALID_ORDER_STATUS, async () => {
        await transact.approve(owner, '0', governance);
        await transact.approve(owner, '0', governance);
      });

      it('marks the request as approved', async () => {
        await transact.approve(owner, '0', governance);
        const { status } = await transact.get(owner, '0');
        assertNumberEquality(status, '1');
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
      itThrows('unauthorized', MUST_BE_GOV_OR_ORDERER, async () => {
        await transact.reject(owner, 0);
      });
      itThrows('request cannot be found', INVALID_ORDER_ID, async () => {
        await transact.reject(owner, '42', governance);
      });
      itThrows('called using a non-pending order id', INVALID_ORDER_STATUS, async () => {
        await transact.reject(owner, '0', governance);
        await transact.reject(owner, '0', governance);
      });

      it('marks the request as rejected', async () => {
        await transact.reject(owner, '0', governance);
        const { status } = await transact.get(owner, '0');
        assertNumberEquality(status, '2');
      });

      it('can be called by the funds owner', async () => {
        await transact.reject(owner, '0', { from: owner });
        const { status } = await transact.get(owner, '0');
        assertNumberEquality(status, '2');
      });

      it('can be called by the transfer spender', async () => {
        await transact.reject(owner, '0', { from: spender });
        const { status } = await transact.get(owner, '0');
        assertNumberEquality(status, '2');
      });

      it('notifies the Token contract via callback', async () => {
        await transact.reject(owner, '0', governance);
        const [{ owner: o, spender: s, amount: a }] = await tokenMock.rejectedCalls();
        assert.equal(o, owner);
        assert.equal(s, spender);
        assertNumberEquality(a, '1000');
      });
    });
  });
});
