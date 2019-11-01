import {
  AccessInstance,
  TokenInstance,
  RegistryInstance,
  TransactInstance
} from '../types/truffle-contracts';
import { assertNumberEquality, itThrows } from './helpers';
import {
  ZERO_ADDRESS,
  MUST_BE_GOVERNOR,
  MUST_BE_ISSUER,
  INSUFFICIENT_FUNDS,
  INVALID_ORDER_STATUS,
  INVALID_ORDER_ID,
  INSUFFICIENT_ALLOWANCE
} from './errors';

const Registry = artifacts.require('Registry');
const Access = artifacts.require('Access');
const Transact = artifacts.require('Transact');
const Token = artifacts.require('Token');

contract('EndToEnd', accounts => {
  const [_, issuer, governor, bob, marie, tom] = accounts;
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
    it('starts with no tokens in total supply and reserve', async () => {
      assertNumberEquality(await token.totalSupply(), '0');
      assertNumberEquality(await token.balanceOf(ZERO_ADDRESS), '0');
    });

    itThrows('Governor tries to issue tokens', MUST_BE_ISSUER, async () => {
      await token.issue('1000', 'Test issuance', { from: bob });
    });

    it('adds a user as an Issuer', async () => {
      await access.addIssuer(issuer, governance);
    });

    it('lets the issuer create some tokens to the reserve', async () => {
      await token.issue('150', 'Test issuance', issuance);
      assertNumberEquality(await token.totalSupply(), '0');
      assertNumberEquality(await token.balanceOf(ZERO_ADDRESS), '150');
    });

    it('adds Bob as an actor', async () => {
      await access.addActor(bob, governance);
      assert.deepEqual(await access.actors(), [bob]);
    });

    it('allocates 100 tokens for Bob', async () => {
      await token.allocate(bob, '100', governance);
      assertNumberEquality(await token.balanceOf(bob), '100');
      assertNumberEquality(await token.balanceOf(marie), '0');
    });

    it('now has the right total supply and reserve tokens', async () => {
      assertNumberEquality(await token.totalSupply(), '100');
      assertNumberEquality(await token.balanceOf(ZERO_ADDRESS), '50');
    });

    it('adds Bob as a governor', async () => {
      await access.addGovernor(bob, governance);
      assert.deepEqual(await access.governors(), [governor, bob]);
    });

    itThrows('Bob tries to issue tokens', MUST_BE_ISSUER, async () => {
      await token.issue('1000', 'Test issuance', { from: bob });
    });

    itThrows('Marie tries to allocate tokens', MUST_BE_GOVERNOR, async () => {
      await token.allocate(bob, '100', { from: marie });
    });

    it('adds Marie as an actor from Bob account', async () => {
      await access.addActor(marie, { from: bob });
      assert.deepEqual(await access.actors(), [bob, marie]);
    });

    itThrows('Marie tries to issue tokens', MUST_BE_ISSUER, async () => {
      await token.issue('1000', 'Test issuance', { from: marie });
    });

    itThrows('Bob tries to transfer more than what they owns', INSUFFICIENT_FUNDS, async () => {
      await token.transfer(marie, '101', { from: bob });
    });

    it('orders a transfer of 5 tokens from Bob to Marie', async () => {
      await token.transfer(marie, '5', { from: bob });
      assertNumberEquality(await transact.countOrders(bob), '1');
      assertNumberEquality(await token.balanceOf(bob), '95');
      assertNumberEquality(await token.frozenOf(bob), '5');
      assertNumberEquality(await token.balanceOf(marie), '0');
    });

    itThrows('approving a wrong transfer', INVALID_ORDER_ID, async () => {
      await transact.approve(bob, '1', governance);
    });

    it('approves the transfer', async () => {
      await transact.approve(bob, '0', governance);
      assertNumberEquality(await token.balanceOf(bob), '95');
      assertNumberEquality(await token.frozenOf(bob), '0');
      assertNumberEquality(await token.balanceOf(marie), '5');
    });

    itThrows('approving a transfer twice', INVALID_ORDER_STATUS, async () => {
      await transact.approve(bob, '0', governance);
    });

    it("adds Tom as an actor using Bob's account", async () => {
      await access.addActor(tom, { from: bob });
      assert.deepEqual(await access.actors(), [bob, marie, tom]);
    });

    it("grants an allowance from Bob's account to Tom", async () => {
      await token.approve(tom, '10', { from: bob });
      assertNumberEquality(await token.allowance(bob, tom), '10');
    });

    itThrows('allowance is insufficient', INSUFFICIENT_ALLOWANCE, async () => {
      await token.transferFrom(bob, marie, '11', { from: tom });
    });

    it('lets Tom perform a transfer using their allowance', async () => {
      await token.transferFrom(bob, marie, '4', { from: tom });
      assertNumberEquality(await transact.countOrders(bob), '2');
      assertNumberEquality(await token.allowance(bob, tom), '6');
      assertNumberEquality(await token.balanceOf(bob), '91');
      assertNumberEquality(await token.frozenOf(bob), '4');
      assertNumberEquality(await token.balanceOf(marie), '5');
    });

    it("approves the transfer using Bob's account", async () => {
      await transact.approve(bob, '1', { from: bob });
      assertNumberEquality(await token.balanceOf(bob), '91');
      assertNumberEquality(await token.frozenOf(bob), '0');
      assertNumberEquality(await token.balanceOf(marie), '9');
    });

    it('lets Tom perform a transfer using their allowance', async () => {
      await token.transferFrom(bob, marie, '6', { from: tom });
      assertNumberEquality(await transact.countOrders(bob), '3');
      assertNumberEquality(await token.allowance(bob, tom), '0');
    });

    it('rejects the transfer', async () => {
      await transact.reject(bob, '2', governance);
      assertNumberEquality(await token.balanceOf(bob), '91');
      assertNumberEquality(await token.frozenOf(bob), '0');
      assertNumberEquality(await token.balanceOf(marie), '9');
    });

    // Add tests:
    // 1) Grant too low.
    // Governor pre-approves a transfer from Marie to Tom of 4 tokens.
    // Marie initiates a transfer of 5 tokens to Tom.
    // Marie tries to apply the grant to her transfer
    it('throws when a grant does not cover an order');
    //   -> It should throw because the grant doesnt cover.
    //   c: Governor rejects the transfer.
    // 2) Grant on wrong person.
    // Marie initiates a transfer of 1 token to Bob.
    // Marie tries to apply the grant to her transfer.
    it('throws when a grant does not match the recipient');
    //   -> It should throw because the grant doesn't apply to Bob.
    //   c: Governor rejects the transfer.
    // 3) Successful grant.
    // Marie initiates a transfer of 4 tokens to Tom.
    // Marie tries to apply the grant to her transfer.
    it('should have properly transfered the tokens');
    //   -> The transfer should pass.
    //   -> Marie should have 5 tokens.
    //   -> Tom should have 4 tokens.
    // 4) Re-used grant.
    // Marie initiates a transfer of 1 token to Tom.
    // Marie tries to apply the grant to her transfer.
    it('should throw because the grant was already used');
    //   -> It should throw because the grant was already used.
    //   c: Governor rejects the transfer.
  });
});
