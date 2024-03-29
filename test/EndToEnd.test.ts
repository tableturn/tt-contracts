import {
  AccessInstance,
  TokenInstance,
  RegistryInstance,
  TransactInstance
} from '../types/truffle-contracts';
import { assertNumberEquality, itThrows } from './helpers/helpers';
import {
  ZERO_ADDRESS,
  MUST_BE_GOVERNOR,
  MUST_BE_ISSUER,
  INSUFFICIENT_FUNDS,
  INVALID_ORDER_STATUS,
  INVALID_ORDER,
  INSUFFICIENT_ALLOWANCE,
  GRANT_AMOUNT_MISMATCH,
  GRANT_RECIPIENT_MISMATCH,
  INVALID_GRANT_STATUS
} from './helpers/errors';
import { BAD_ID, ONE, ZERO } from './helpers/constants';
import BN from 'bn.js';

const Registry = artifacts.require('Registry');
const Access = artifacts.require('Access');
const Transact = artifacts.require('Transact');
const Token = artifacts.require('Token');

const ISSUANCE_REASON = 'Test Issuance.';

// TODO: We might want to add at least two tests around `transferWithReference` and `transferFromWithReference`.
contract('EndToEnd', accounts => {
  const [, issuer, governor, bob, marie, tom] = accounts;
  const governance = { from: governor };
  const issuance = { from: issuer };
  let registry: RegistryInstance;
  let access: AccessInstance;
  let transact: TransactInstance;
  let token: TokenInstance;

  before(async () => {
    // Instanciate a few contracts.
    [registry, access, transact, token] = await Promise.all([
      Registry.new(),
      Access.new(),
      Transact.new(),
      Token.new()
    ]);
    // Initialize various things.
    await Promise.all([
      access.initialize(governor),
      registry.initialize(access.address),
      transact.initialize(registry.address),
      token.initialize(registry.address)
    ]);
    // Setup contracts in our registry.
    await Promise.all([
      registry.setAccessContract(access.address, governance),
      registry.setTransactContract(transact.address, governance),
      registry.setTokenContract(token.address, governance)
    ]);
  });

  describe('it performs end-to-end', () => {
    // # Proper initial state.
    // Verify that the total supply and the balance of the reserve are
    // both zero after initial deployment.
    it('starts with no tokens in total supply and reserve', async () => {
      assertNumberEquality(await token.totalSupply(), '0');
      assertNumberEquality(await token.balanceOf(ZERO_ADDRESS), '0');
    });

    // # Random Account Issuance
    // Ensures that a random account cannot issue tokens.
    itThrows('a random account issues tokens', MUST_BE_ISSUER, async () => {
      await token.issue('1000', ISSUANCE_REASON, { from: marie });
    });

    it('lets our governor account be an actor', async () => {
      await access.addActor(governor, governance);
      assert.deepEqual(await access.actors(), [ZERO_ADDRESS, governor])
    });

    // # Governor Issuance
    // Ensures that the governor cannot issue tokens.
    itThrows('a governor issues tokens', MUST_BE_ISSUER, async () => {
      await token.issue('1000', ISSUANCE_REASON, { from: bob });
    });

    // # Random Account Adds Issuer
    // Ensures that a random account cannot add an issuer.
    itThrows('a random account adds an issuer', MUST_BE_GOVERNOR, async () => {
      await access.addIssuer(issuer, { from: marie });
    });

    // # Governor Adds Issuer
    // Verifies that an issuer can be added by a governor.
    it('adds a user as a governor', async () => {
      await access.addIssuer(issuer, governance);
    });

    // # Issuer Token Issuance
    // Verifies that an issuer can issue token.
    it('lets the issuer create some tokens in the reserve, while not counting it as total supply', async () => {
      await token.issue('150', ISSUANCE_REASON, issuance);
      assertNumberEquality(await token.balanceOf(ZERO_ADDRESS), '150');
      assertNumberEquality(await token.totalSupply(), '0');
    });

    it('adds Bob as an actor', async () => {
      await access.addActor(bob, governance);
      assert.deepEqual(await access.actors(), [ZERO_ADDRESS, governor, bob]);
    });

    // # Token Allocation
    // Verifies that a governor can allocate tokens.
    // Balances: Bob = 100, Marie = 0
    it('allocates 100 tokens for Bob', async () => {
      // Allocate funds from the reserve into Bob's account.
      await token.allocate(bob, '100', governance);
      // Get order ID for the allocation.
      const orderIdx = (await transact.orderCount(ZERO_ADDRESS)).sub(new BN(1));
      const orderId = await transact.orderIdByOwnerAndIndex(ZERO_ADDRESS, orderIdx);
      const order = await transact.orderById(orderId);
      // Make sure that the reference is correct.
      assert.equal('Allocation from Reserve', order.ref);
      // Accept the transfer order.
      await transact.approve(orderId, governance)

      assertNumberEquality(await token.balanceOf(bob), '100');
      assertNumberEquality(await token.balanceOf(marie), '0');
    });

    it('now has the right total supply and reserve tokens', async () => {
      assertNumberEquality(await token.totalSupply(), '100');
      assertNumberEquality(await token.balanceOf(ZERO_ADDRESS), '50');
    });

    // # Adding Governors.
    // Ensures that a governor can add other governors.
    it('adds Bob as a governor', async () => {
      await access.addGovernor(bob, governance);
      assert.deepEqual(await access.governors(), [governor, bob]);
    });

    // # Random Account Token Issuance
    // Ensures that a random account cannot issue tokens.
    itThrows('a random account issues tokens', MUST_BE_ISSUER, async () => {
      await token.issue('1000', ISSUANCE_REASON, { from: marie });
    });

    // # Governor Token Issuance
    // Ensures that a governor cannot issue tokens.
    itThrows('Bob tries to issue tokens', MUST_BE_ISSUER, async () => {
      await token.issue('1000', ISSUANCE_REASON, { from: bob });
    });

    // # Random Account Token Allocation
    // Ensures that a random account cannot allocate tokens.
    itThrows('Marie tries to allocate tokens', MUST_BE_GOVERNOR, async () => {
      await token.allocate(bob, '100', { from: marie });
    });

    it('adds Marie as an actor from Bob account', async () => {
      await access.addActor(marie, { from: bob });
      assert.deepEqual(await access.actors(), [ZERO_ADDRESS, governor, bob, marie]);
    });

    itThrows('Marie tries to issue tokens', MUST_BE_ISSUER, async () => {
      await token.issue('1000', ISSUANCE_REASON, { from: marie });
    });

    // Balances: Bob = 101, Marie = 0
    itThrows('Bob tries to transfer more than what they owns', INSUFFICIENT_FUNDS, async () => {
      await token.transfer(marie, '101', { from: bob });
    });

    // Balances: Bob = 95+5, Marie = 0
    it('orders a transfer of 5 tokens from Bob to Marie', async () => {
      await token.transfer(marie, '5', { from: bob });
      assertNumberEquality(await transact.orderCount(bob), '2');
      assertNumberEquality(await token.balanceOf(bob), '95');
      assertNumberEquality(await token.frozenOf(bob), '5');
      assertNumberEquality(await token.balanceOf(marie), '0');
    });

    // Balances: Bob = 95+5, Marie = 0
    itThrows('approving a wrong transfer', INVALID_ORDER, async () => {
      await transact.approve(BAD_ID, governance);
    });

    // Balances: Bob = 95, Marie = 5
    it('approves the transfer', async () => {
      const orderId = await transact.orderIdByOwnerAndIndex(bob, '1');
      await transact.approve(orderId, governance);
      assertNumberEquality(await token.balanceOf(bob), '95');
      assertNumberEquality(await token.frozenOf(bob), '0');
      assertNumberEquality(await token.balanceOf(marie), '5');
    });

    // Balances: Bob = 95, Marie = 5
    itThrows('approving a transfer twice', INVALID_ORDER_STATUS, async () => {
      const orderId = await transact.orderIdByOwnerAndIndex(bob, '1');
      await transact.approve(orderId, governance);
    });

    it("adds Tom as an actor using Bob's account", async () => {
      await access.addActor(tom, { from: bob });
      assert.deepEqual(await access.actors(), [ZERO_ADDRESS, governor, bob, marie, tom]);
    });

    // Balances: Bob = 95, Marie = 5
    // Allowances: Tom = 10
    it("grants an allowance from Bob's account to Tom", async () => {
      await token.approve(tom, '10', { from: bob });
      assertNumberEquality(await token.allowance(bob, tom), '10');
    });

    // Balances: Bob = 95, Marie = 5
    // Allowances: Tom = 10
    itThrows('allowance is insufficient', INSUFFICIENT_ALLOWANCE, async () => {
      await token.transferFrom(bob, marie, '11', { from: tom });
    });

    // Balances: Bob = 91+4, Marie = 5
    // Allowances: Tom = 6
    it('lets Tom perform a transfer using their allowance', async () => {
      await token.transferFrom(bob, marie, '4', { from: tom });
      assertNumberEquality(await transact.orderCount(bob), '3');
      assertNumberEquality(await token.allowance(bob, tom), '6');
      assertNumberEquality(await token.balanceOf(bob), '91');
      assertNumberEquality(await token.frozenOf(bob), '4');
      assertNumberEquality(await token.balanceOf(marie), '5');
    });

    // Balances: Bob = 91, Marie = 9
    // Allowances: Tom = 6
    it("approves the transfer using Bob's account", async () => {
      const orderId = await transact.orderIdByOwnerAndIndex(bob, '2');
      await transact.approve(orderId, governance);
      assertNumberEquality(await token.balanceOf(bob), '91');
      assertNumberEquality(await token.frozenOf(bob), '0');
      assertNumberEquality(await token.balanceOf(marie), '9');
    });

    // Balances: Bob = 85+6, Marie = 9
    // Allowances: Tom = 0
    it('lets Tom perform a transfer using their allowance', async () => {
      await token.transferFrom(bob, marie, '6', { from: tom });
      assertNumberEquality(await transact.orderCount(bob), '4');
      assertNumberEquality(await token.allowance(bob, tom), '0');
    });

    // Balances: Bob = 91, Marie = 9
    // Allowances: Tom = 6
    it('rejects the transfer', async () => {
      const orderId = await transact.orderIdByOwnerAndIndex(bob, '3');
      await transact.reject(orderId, governance);
      assertNumberEquality(await token.balanceOf(bob), '91');
      assertNumberEquality(await token.frozenOf(bob), '0');
      assertNumberEquality(await token.balanceOf(marie), '9');
      assertNumberEquality(await token.allowance(bob, tom), '6');
    });

    // Balances: Bob = 91, Marie = 9
    // Allowances: Tom = 6
    it('allows a governor to set up some grants', async () => {
      await Promise.all([
        transact.preapprove(marie, tom, '4', governance),
        token.transfer(tom, '5', { from: marie })
      ]);
      const [orderCount, grantCount] = await Promise.all([
        transact.orderCount(marie),
        transact.grantCount(marie)
      ]);
      assertNumberEquality(orderCount, '4');
      assertNumberEquality(grantCount, '1');
    });

    // # Grant too low.
    // Ensures that a grant cannot be applied if it does not cover the transfered amount.
    // Balances: Bob = 91, Marie = 9
    // Allowances: Tom = 6
    itThrows('a grant does not cover an order', GRANT_AMOUNT_MISMATCH, async () => {
      const [orderId, grantId] = await Promise.all([
        transact.orderCount(marie),
        transact.grantCount(marie)
      ])
        .then(counts => counts.map(c => c.sub(ONE)))
        .then(([orderIdx, grantIdx]) =>
          Promise.all([
            transact.orderIdByOwnerAndIndex(marie, orderIdx),
            transact.grantIdByOwnerAndIndex(marie, grantIdx)
          ])
        );
      await transact.approveGranted(orderId, grantId, { from: marie });
    });

    // # Grant Recipient Mismatch
    // Verifies that a grant cannot be applied to a different recipient than planned.
    // Balances: Bob = 91, Marie = 9
    // Allowances: Tom = 6
    itThrows('a grant does not match the recipient', GRANT_RECIPIENT_MISMATCH, async () => {
      await token.transfer(bob, '1', { from: marie });
      const [orderIdx, grantIdx, orderId, grantId] = await Promise.all([
        transact.orderCount(marie),
        transact.grantCount(marie)
      ])
        .then(counts => counts.map(c => c.sub(ONE)))
        .then(([orderIdx, grantIdx]) =>
          Promise.all([
            orderIdx,
            grantIdx,
            transact.orderIdByOwnerAndIndex(marie, orderIdx),
            transact.grantIdByOwnerAndIndex(marie, grantIdx)
          ])
        );
      assertNumberEquality(orderIdx, '4');
      assertNumberEquality(grantIdx, '0');
      await transact.approveGranted(orderId, grantId, { from: marie });
    });

    // # Successful Grant
    // Verifies that the tokens are transfered when a grant is properly applied.
    // Balances: Bob = 91, Marie = 2, Tom = 1
    // Allowances: Tom = 6
    it('should have properly transfered the tokens', async () => {
      await token.transfer(tom, '1', { from: marie });
      const [orderId, grantId] = await Promise.all([
        transact.orderCount(marie),
        transact.grantCount(marie)
      ])
        .then(counts => counts.map(c => c.sub(ONE)))
        .then(([orderIdx, grantIdx]) =>
          Promise.all([
            transact.orderIdByOwnerAndIndex(marie, orderIdx),
            transact.grantIdByOwnerAndIndex(marie, grantIdx)
          ])
        );
      await transact.approveGranted(orderId, grantId, { from: marie });
      assertNumberEquality(await token.balanceOf(marie), '2');
      assertNumberEquality(await token.balanceOf(tom), '1');
    });

    // # Already-Used Grant
    // Ensures that an already-used grant cannot be used twice.
    // Balances: Bob = 91, Marie = 1, Tom = 1
    // Allowances: Tom = 6
    itThrows('a grant was already used', INVALID_GRANT_STATUS, async () => {
      await token.transfer(tom, '1', { from: marie });
      const [orderIdx, grantIdx, orderId, grantId] = await Promise.all([
        transact.orderCount(marie),
        transact.grantCount(marie)
      ])
        .then(counts => counts.map(c => c.sub(ONE)))
        .then(([orderIdx, grantIdx]) =>
          Promise.all([
            orderIdx,
            grantIdx,
            transact.orderIdByOwnerAndIndex(marie, orderIdx),
            transact.grantIdByOwnerAndIndex(marie, grantIdx)
          ])
        );
      assertNumberEquality(orderIdx, '6');
      assertNumberEquality(grantIdx, '0');
      await transact.approveGranted(orderId, grantId, { from: marie });
    });

    // # Balances Test
    // Ensures that an already-used grant cannot be used twice.
    // Balances: Bob = 91, Marie = 1, Tom = 1
    // Allowances: Tom = 6
    it('makes sure that all balances are correct', async () => {
      assertNumberEquality(await token.balanceOf(bob), '91');
      assertNumberEquality(await token.frozenOf(bob), '0');
      assertNumberEquality(await token.balanceOf(marie), '1');
      assertNumberEquality(await token.frozenOf(marie), '7');
      assertNumberEquality(await token.balanceOf(tom), '1');
      assertNumberEquality(await token.frozenOf(tom), '0');
      assertNumberEquality(await token.allowance(bob, tom), '6');
    });
  });
});
