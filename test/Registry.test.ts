import { AccessInstance, RegistryInstance } from '../types/truffle-contracts';
import { itThrows } from './helpers/helpers';
import { DOUBLE_INIT, MUST_BE_GOVERNOR } from './helpers/errors';

const Access = artifacts.require('Access');
const Registry = artifacts.require('Registry');

contract('Registry', accounts => {
  const [, governor, fakeContract] = accounts;
  const governance = { from: governor };
  let access: AccessInstance;
  let registry: RegistryInstance;

  before(async () => {
    access = await Access.new();
    await access.initialize(governor);
  });

  beforeEach(async () => {
    registry = await Registry.new();
    await registry.initialize(access.address);
  });

  itThrows('initialize is called more than once', DOUBLE_INIT, async () => {
    await registry.initialize(governor);
  });

  it('should keep track of the access address passed during initialization', async () => {
    assert.equal(await registry.access(), access.address);
  });

  describe('setAccessContract', () => {
    itThrows('unauthorized', MUST_BE_GOVERNOR, async () => {
      await registry.setAccessContract(fakeContract);
    });

    it('should allow a governor to reset the Access module', async () => {
      await registry.setAccessContract(fakeContract, governance);
      assert.equal(await registry.access(), fakeContract);
    });
  });

  describe('setTransactContract', () => {
    itThrows('unauthorized', MUST_BE_GOVERNOR, async () => {
      await registry.setTransactContract(fakeContract);
    });

    it('should allow a governor to reset the Transact module', async () => {
      await registry.setTransactContract(fakeContract, governance);
      assert.equal(await registry.transact(), fakeContract);
    });
  });

  describe('setTokenContract', () => {
    itThrows('unauthorized', MUST_BE_GOVERNOR, async () => {
      await registry.setTokenContract(fakeContract);
    });

    it('should allow a governor to reset the Access module', async () => {
      await registry.setTokenContract(fakeContract, governance);
      assert.equal(await registry.token(), fakeContract);
    });
  });
});
