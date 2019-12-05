import { AccessInstance, RegisterInstance, RegistryInstance } from '../types/truffle-contracts';
import { itThrows } from './helpers/helpers';
import { DOUBLE_INIT, MUST_BE_GOVERNOR, DUPLICATED_HASH } from './helpers/errors';

const Registry = artifacts.require('Registry');
const Access = artifacts.require('Access');
const Register = artifacts.require('Register');

contract('Register', accounts => {
  const [_, issuer, governor, actor1] = accounts;
  const governance = { from: governor };
  let registry: RegistryInstance;
  let access: AccessInstance;
  let register: RegisterInstance;

  const m1 = web3.utils.toHex('Hello!');
  const h1 = '0x6cdba77591a790691c694fa0be937f835b8a589095e427022aa1035e579ee596';
  const m2 = web3.utils.toHex('Goodbye!');
  const h2 = '0xecb1d34c319112dcbe06d2413ddfed16ced8161e03ca09178d58570677a5049f';

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
    await access.addActor(actor1, governance);
  });

  beforeEach(async () => {
    register = await Register.new();
    await register.initialize(registry.address);
    await registry.setRegisterContract(register.address, governance);
  });

  describe('initialization', () => {
    itThrows('initialize is called more than once', DOUBLE_INIT, async () => {
      await register.initialize(registry.address);
    });
    it('maintains a reference to the Registry passed during initialization', async () => {
      assert.equal(await register.reg(), registry.address);
    });
  });

  describe('hashAndAdd', () => {
    itThrows('unauthorized', MUST_BE_GOVERNOR, async () => {
      await register.hashAndAdd(m1, { from: actor1 });
    });
    itThrows('adding the same value twice', DUPLICATED_HASH, async () => {
      await Promise.all([1, 2].map(() => register.hashAndAdd(m1, { from: governor })));
    });

    it('really hashes the value', async () => {
      await register.hashAndAdd(m1, { from: governor });
      assert.isTrue(await register.containsHash(h1));
      assert.isFalse(await register.containsHash(h2));
    });

    it('adds the hashed value', async () => {
      await register.hashAndAdd(m1, { from: governor });
      assert.isTrue(await register.containsHashOf(m1));
      assert.isFalse(await register.containsHashOf(m2));
    });

    it('allows to find hash back using either the hash or the value', async () => {
      await register.hashAndAdd(m1, { from: governor });
      assert.isTrue(await register.containsHash(h1));
      assert.isTrue(await register.containsHashOf(m1));
      assert.isFalse(await register.containsHash(h2));
      assert.isFalse(await register.containsHashOf(m2));
    });
  });

  describe('addHash', () => {
    itThrows('unauthorized', MUST_BE_GOVERNOR, async () => {
      await register.addHash(m1, { from: actor1 });
    });
    itThrows('adding the same value twice', DUPLICATED_HASH, async () => {
      await Promise.all([1, 2].map(() => register.addHash(m1, { from: governor })));
    });

    it('does not rehash the value', async () => {
      await register.addHash(h1, { from: governor });
      assert.isTrue(await register.containsHash(h1));
    });

    it('allows to find hash back using either the hash or the value', async () => {
      await register.addHash(h1, { from: governor });
      assert.isTrue(await register.containsHash(h1));
      assert.isTrue(await register.containsHashOf(m1));
      assert.isFalse(await register.containsHash(h2));
      assert.isFalse(await register.containsHashOf(m2));
    });
  });
});
