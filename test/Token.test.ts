import {
  AccessInstance,
  TokenInstance,
  RegistryInstance,
  TransactMockInstance
} from '../types/truffle-contracts';
import { itThrows, assertNumberEquality } from './helpers/helpers';
import {
  ZERO_ADDRESS,
  INSUFFICIENT_FUNDS,
  OWNER_SAME_AS_RECIPIENT,
  SELF_ALLOWANCE,
  INSUFFICIENT_ALLOWANCE,
  MUST_BE_TRANSACT,
  DOUBLE_INIT,
  MUST_BE_GOVERNOR,
  MUST_BE_ISSUER,
  CANNOT_RETRIEVE_FROZEN,
  RECIPIENT_NOT_ACTOR,
  OWNER_NOT_ACTOR,
  UNKNOWN_ERC1404_CODE,
  INVALID_ZERO_AMOUNT
} from './helpers/errors';

const Registry = artifacts.require('Registry');
const Access = artifacts.require('Access');
const TransactMock = artifacts.require('TransactMock');
const Token = artifacts.require('Token');

contract('Token', accounts => {
  const [, issuer, governor, actor1, actor2, actor3, acc1, acc2, fakeTransact] = accounts;
  const [governance, issuance] = [governor, issuer].map(v => ({
    from: v
  }));
  var registry: RegistryInstance,
    access: AccessInstance,
    transact: TransactMockInstance,
    token: TokenInstance;

  before(async () => {
    // Instanciate a few contracts.
    [registry, access] = await Promise.all([Registry.new(), Access.new()]);
    // Initialize various things.
    await Promise.all([access.initialize(governor), registry.initialize(access.address)]);
    // Setup contracts in our registry.
    await Promise.all([
      access.addIssuer(issuer, governance),
      registry.setAccessContract(access.address, governance)
    ]);
    // Set up 3 accounts as actors.
    Promise.all([actor1, actor2, actor3].map(async actor => access.addActor(actor, governance)));
  });

  beforeEach(async () => {
    [token, transact] = await Promise.all([Token.new(), TransactMock.new()]);
    await token.initialize(registry.address);
    await Promise.all([
      registry.setTokenContract(token.address, governance),
      registry.setTransactContract(transact.address, governance)
    ]);
  });

  describe('initialization', () => {
    itThrows('initialize is called more than once', DOUBLE_INIT, async () => {
      await token.initialize(registry.address);
    });
    it('maintains a reference to the Registry passed during initialization', async () => {
      assert.equal(await token.reg(), registry.address);
    });
  });

  describe('public information', () => {
    it('exposes its name', async () => {
      const ret = await token.name();
      assert.equal(ret, 'Consilience Ventures Digital Share');
    });
    it('exposes its symbol', async () => {
      const ret = await token.symbol();
      assert.equal(ret, 'CVD');
    });
    it('exposes its precision', async () => {
      const ret = await token.decimals();
      assertNumberEquality(ret, '6');
    });
    it('exposes its total supply', async () => {
      const ret = await token.totalSupply();
      assertNumberEquality(ret, '0');
    });
  });

  describe('ERC1404', async () => {
    describe('detectTransferRestriction', async () => {
      it('does not return an error code when inputs are good', async () => {
        const code = await token.detectTransferRestriction(actor1, actor2, '100');
        assertNumberEquality(code, '0');
      });
      it('detects when owner is not an actor', async () => {
        const code = await token.detectTransferRestriction(acc1, actor2, '100');
        assert.notEqual(code.toString(), '0');
        assertNumberEquality(code, await token.ERRC_OWNER_NOT_ACTOR());
      });
      it('detects when recipient is not an actor', async () => {
        const code = await token.detectTransferRestriction(actor1, acc2, '100');
        assert.notEqual(code.toString(), '0');
        assertNumberEquality(code, await token.ERRC_RECIPIENT_NOT_ACTOR());
      });
      it('detects when owner and recipient are the same', async () => {
        const code = await token.detectTransferRestriction(actor1, actor1, '100');
        assert.notEqual(code.toString(), '0');
        assertNumberEquality(code, await token.ERRC_OWNER_SAME_AS_RECIPIENT());
      });
    });

    describe('messageForTransferRestriction', async () => {
      itThrows('an invalid code is passed', UNKNOWN_ERC1404_CODE, async () => {
        await token.messageForTransferRestriction('255');
      });

      it('matches the OWNER_NOT_ACTOR error pair', async () => {
        const [code, msg] = await Promise.all([
          token.ERRC_OWNER_NOT_ACTOR(),
          token.ERR_OWNER_NOT_ACTOR()
        ]);
        assert.equal(msg, await token.messageForTransferRestriction(code));
      });

      it('matches the RECIPIENT_NOT_ACTOR error pair', async () => {
        const [code, msg] = await Promise.all([
          token.ERRC_RECIPIENT_NOT_ACTOR(),
          token.ERR_RECIPIENT_NOT_ACTOR()
        ]);
        assert.equal(msg, await token.messageForTransferRestriction(code));
      });

      it('matches the OWNER_SAME_AS_RECIPIENT error pair', async () => {
        const [code, msg] = await Promise.all([
          token.ERRC_OWNER_SAME_AS_RECIPIENT(),
          token.ERR_OWNER_SAME_AS_RECIPIENT()
        ]);
        assert.equal(msg, await token.messageForTransferRestriction(code));
      });
    });
  });

  describe('issue', () => {
    itThrows('unauthorized for unknowns', MUST_BE_ISSUER, async () => {
      await token.issue('500', 'Test issuance', { from: acc1 });
    });
    itThrows('unauthorized for actors', MUST_BE_ISSUER, async () => {
      await token.issue('500', 'Test issuance', { from: actor1 });
    });
    itThrows('unauthorized for governors', MUST_BE_ISSUER, async () => {
      await token.issue('500', 'Test issuance', governance);
    });

    describe('when successful', () => {
      it('adds the amount to the zero-address without impacting total supply', async () => {
        const balance1 = await token.balanceOf(ZERO_ADDRESS);
        await Promise.all(
          [5, 50, 500, 5000].map(amount => {
            return token.issue(amount, 'Test issuance', issuance);
          })
        );
        const balance2 = await token.balanceOf(ZERO_ADDRESS);
        assertNumberEquality(balance2.sub(balance1), '5555');
      });
      it('does not impact total supply', async () => {
        await token.issue('5000', 'Test issuance', issuance);
        assertNumberEquality(await token.totalSupply(), '0');
      });
    });
  });

  describe('allocate', () => {
    beforeEach(async () => {
      await token.issue('5000', 'Test issuance', issuance);
    });

    itThrows('unauthorized unknown', MUST_BE_GOVERNOR, async () => {
      await token.allocate(actor1, '500', { from: acc1 });
    });
    itThrows('unauthorized actor', MUST_BE_GOVERNOR, async () => {
      await token.allocate(actor1, '500', { from: actor1 });
    });
    itThrows('unauthorized issuer', MUST_BE_GOVERNOR, async () => {
      await token.allocate(actor1, '500', issuance);
    });
    itThrows('recipient is not an actor', RECIPIENT_NOT_ACTOR, async () => {
      await token.allocate(acc1, '500', governance);
    });

    it('credits the recipients of the specified amount', async () => {
      var total = 0;
      [100, 200, 300, 400].forEach(async amount => {
        total += amount;
        await token.allocate(actor1, amount, governance);
      });
      assertNumberEquality(await token.balanceOf(actor1), total);
    });

    it('carries over to totalSupply', async () => {
      var total = 0;
      [actor1, actor2].forEach(async actor => {
        [100, 200].forEach(async amount => {
          total += amount;
          await token.allocate(actor, amount, governance);
        });
      });
      assertNumberEquality(await token.totalSupply(), total);
    });

    it('subtracts from the reserve', async () => {
      const reserve1 = await token.balanceOf(ZERO_ADDRESS);
      await Promise.all(
        [6, 60, 600, 6000].map(amount => {
          return token.issue(amount, 'Test issuance', issuance);
        })
      );
      const reserve2 = await token.balanceOf(ZERO_ADDRESS);
      assertNumberEquality(reserve2.sub(reserve1), '6666');
    });
  });

  describe('balanceOf', () => {
    it('succeeds regardless of the account', async () => {
      const ret = await token.balanceOf(acc1);
      assertNumberEquality(ret, 0);
    });
  });

  describe('frozenOf', () => {
    it('succeeds regardless of the account', async () => {
      const ret = await token.frozenOf(acc1);
      assertNumberEquality(ret, 0);
    });
  });

  describe('transfer', () => {
    beforeEach(async () => {
      await token.issue('5000', 'Test issuance', issuance);
    });

    itThrows('sender is not an actor', OWNER_NOT_ACTOR, async () => {
      await token.transfer(actor1, '500', { from: acc1 });
    });
    itThrows('recipient is not an actor', RECIPIENT_NOT_ACTOR, async () => {
      await token.transfer(acc1, '500', { from: actor1 });
    });
    itThrows('there are not enough funds', INSUFFICIENT_FUNDS, async () => {
      await token.transfer(actor2, '100', { from: actor1 });
    });
    itThrows('sender is the same as recipient', OWNER_SAME_AS_RECIPIENT, async () => {
      await token.allocate(actor1, '100', governance);
      await token.transfer(actor1, '100', { from: actor1 });
    });
    itThrows('amount is zero', INVALID_ZERO_AMOUNT, async () => {
      await token.transfer(actor3, '0', { from: actor1 });
    });

    describe('when successful', () => {
      beforeEach(async () => {
        await token.allocate(actor1, '2000', governance);
      });

      it('freezes the funds from the owner account', async () => {
        await token.transfer(actor3, '100', { from: actor1 });
        assertNumberEquality(await token.balanceOf(actor1), '1900');
        assertNumberEquality(await token.frozenOf(actor1), '100');
      });

      it('does not credit the recipient', async () => {
        await token.transfer(actor3, '100', { from: actor1 });
        assertNumberEquality(await token.balanceOf(actor3), '0');
      });

      it('calls a request on the Transact contract', async () => {
        await token.transfer(actor3, '100', { from: actor1 });
        const [res] = (await transact.requestCalls()).slice(-1);
        assert.equal(res.owner, actor1);
        assert.equal(res.spender, actor1);
        assert.equal(res.recipient, actor3);
        assertNumberEquality(res.amount, '100');
      });
    });
  });

  describe('transferFrom', () => {
    beforeEach(async () => {
      await token.issue('5000', 'Test issuance', issuance);
    });

    itThrows('owner is not an actor', OWNER_NOT_ACTOR, async () => {
      await token.transferFrom(acc1, actor3, '100', { from: actor1 });
    });
    itThrows('recipient is not an actor', RECIPIENT_NOT_ACTOR, async () => {
      await token.transferFrom(actor2, acc2, '100', { from: actor1 });
    });
    itThrows('owner and spender are the same', SELF_ALLOWANCE, async () => {
      await token.transferFrom(actor1, actor2, '100', { from: actor1 });
    });
    itThrows('sender is the same as recipient', OWNER_SAME_AS_RECIPIENT, async () => {
      await token.transferFrom(actor2, actor2, '100', { from: actor1 });
    });
    itThrows('allowance is insuficient', INSUFFICIENT_ALLOWANCE, async () => {
      await token.transferFrom(actor2, actor3, '100', { from: actor1 });
    });
    itThrows('amount is zero', INVALID_ZERO_AMOUNT, async () => {
      await token.transfer(actor3, '0', { from: actor1 });
    });

    describe('when successful', () => {
      beforeEach(async () => {
        await Promise.all([
          token.allocate(actor1, '2000', governance),
          token.approve(acc1, '300', { from: actor1 })
        ]);
      });

      it('freezes the funds from the owner account', async () => {
        await token.transferFrom(actor1, actor3, '100', { from: acc1 });
        assertNumberEquality(await token.balanceOf(actor1), '1900');
        assertNumberEquality(await token.frozenOf(actor1), '100');
      });

      it('does not credit the recipient', async () => {
        await token.transferFrom(actor1, actor3, '100', { from: acc1 });
        assertNumberEquality(await token.balanceOf(actor3), '0');
      });

      it('decreases the allowance', async () => {
        await token.transferFrom(actor1, actor3, '100', { from: acc1 });
        assertNumberEquality(await token.allowance(actor1, acc1), '200');
      });

      it('calls a request on the Transact contract', async () => {
        await token.transferFrom(actor1, actor3, '100', { from: acc1 });
        const [res] = (await transact.requestCalls()).slice(-1);
        assert.equal(res.owner, actor1);
        assert.equal(res.spender, acc1);
        assert.equal(res.recipient, actor3);
        assertNumberEquality(res.amount, '100');
      });
    });
  });

  describe('allowance', () => {
    it('succeeds regardless of the account', async () => {
      const ret = await token.allowance(acc1, acc2);
      assertNumberEquality(ret, 0);
    });
  });

  describe('approve', () => {
    it('overwrites the previous value', async () => {
      await token.approve(actor2, '1000', { from: actor1 });
      await token.approve(actor2, '500', { from: actor1 });
      assertNumberEquality(await token.allowance(actor1, actor2), '500');

      await token.approve(actor3, '200', { from: actor1 });
      assertNumberEquality(await token.allowance(actor1, actor3), '200');
    });
  });

  describe('callbacks', () => {
    beforeEach(async () => {
      // This mocks an account and replaces the transact contract by
      // an address we have the keys for, allowing to simulate calls using
      // that address later on.
      await token.issue('1000', 'Test Issuance', issuance);
      await token.allocate(actor1, '1000', governance);
      await token.transfer(actor2, '300', { from: actor1 });
      await registry.setTransactContract(fakeTransact, governance);
    });

    describe('transferApproved', () => {
      itThrows('the caller is not the registered Transact token', MUST_BE_TRANSACT, async () => {
        await token.transferApproved(actor1, actor1, '1000');
      });

      it('unfreezes funds and transfers them', async () => {
        await token.transferApproved(actor1, actor2, '300', { from: fakeTransact });

        assertNumberEquality(await token.balanceOf(actor1), '700');
        assertNumberEquality(await token.frozenOf(actor1), '0');
        assertNumberEquality(await token.balanceOf(actor2), '300');
      });

      it('properly handles allowances', async () => {
        await token.approve(actor2, '200', { from: actor1 });
        await token.transferApproved(actor1, actor3, '300', { from: fakeTransact });

        assertNumberEquality(await token.balanceOf(actor1), '700');
        assertNumberEquality(await token.frozenOf(actor1), '0');
        assertNumberEquality(await token.allowance(actor1, actor2), '200');
        assertNumberEquality(await token.balanceOf(actor3), '300');
      });
    });

    describe('transferRejected', () => {
      itThrows('the caller is not the registered Transact token', MUST_BE_TRANSACT, async () => {
        await token.transferRejected(actor1, actor1, '1000');
      });

      it('unfreezes funds and transfers them back', async () => {
        await token.transferRejected(actor1, actor1, '300', { from: fakeTransact });

        assertNumberEquality(await token.balanceOf(actor1), '1000');
        assertNumberEquality(await token.frozenOf(actor1), '0');
      });

      it('properly handles allowances', async () => {
        await token.transferRejected(actor1, actor2, '200', { from: fakeTransact });

        assertNumberEquality(await token.balanceOf(actor1), '900');
        assertNumberEquality(await token.frozenOf(actor1), '100');
        assertNumberEquality(await token.allowance(actor1, actor2), '200');
      });
    });
  });

  describe('retrieveDeadTokens', () => {
    itThrows('called as unknown', MUST_BE_GOVERNOR, async () => {
      await token.retrieveDeadTokens(actor1, actor2, { from: acc1 });
    });
    itThrows('called as actor', MUST_BE_GOVERNOR, async () => {
      await token.retrieveDeadTokens(actor1, actor2, { from: actor1 });
    });
    itThrows('called as issuer', MUST_BE_GOVERNOR, async () => {
      await token.retrieveDeadTokens(actor1, actor2, issuance);
    });
    itThrows('recipient is not an actor', RECIPIENT_NOT_ACTOR, async () => {
      await token.retrieveDeadTokens(actor1, acc1, governance);
    });
    itThrows('owner is not an actor', OWNER_NOT_ACTOR, async () => {
      await token.retrieveDeadTokens(acc1, actor2, governance);
    });
    describe('when there are tokens to retrieve', () => {
      beforeEach(async () => {
        await token.issue('1000', 'Test issuance', issuance);
        await token.allocate(actor1, '1000', governance);
      });

      itThrows('owner still has frozen funds', CANNOT_RETRIEVE_FROZEN, async () => {
        await token.transfer(actor3, '50', { from: actor1 });
        assertNumberEquality(await token.balanceOf(actor3), '0');
        assertNumberEquality(await token.balanceOf(actor1), '950');
        assertNumberEquality(await token.frozenOf(actor1), '50');
        await token.retrieveDeadTokens(actor1, actor3, governance);
      });

      it('immediatelly moves all the tokens when successful', async () => {
        await token.retrieveDeadTokens(actor1, actor3, governance);
        assertNumberEquality(await token.balanceOf(actor1), '0');
        assertNumberEquality(await token.balanceOf(actor3), '1000');
      });
    });
  });
});
