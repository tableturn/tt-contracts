import { AccessInstance } from '../types/truffle-contracts';
import { itThrows } from './helpers/helpers';
import {
  MUST_BE_GOVERNOR,
  DUPLICATED_ADDRESS,
  DOUBLE_INIT,
  SELF_TERMINATION
} from './helpers/errors';

const Access = artifacts.require('Access');

contract('Access', accounts => {
  const [, issuer, governor, actor, acc1, acc2] = accounts;
  const governance = { from: governor };
  var access: AccessInstance;

  beforeEach(async () => {
    access = await Access.new();
    await access.initialize(governor);
    await access.addIssuer(issuer, governance);
    await access.addActor(actor, governance);
  });

  describe('initializer', () => {
    itThrows('called more than once', DOUBLE_INIT, async () => {
      await access.initialize(governor);
    });

    it('should keep track of the governor passed during initialization', async () => {
      assert.deepEqual(await access.governors(), [governor]);
    });
  });

  describe('issuance functions', () => {
    describe('addIssuer', () => {
      itThrows('called from an unknown account', MUST_BE_GOVERNOR, async () => {
        await access.addIssuer(issuer, { from: acc1 });
      });
      itThrows('called from an actor account', MUST_BE_GOVERNOR, async () => {
        await access.addIssuer(issuer, { from: actor });
      });
      itThrows('double-adding', DUPLICATED_ADDRESS, async () => {
        await access.addIssuer(issuer, governance);
      });

      it('allows governors to add issuers', async () => {
        await access.addIssuer(acc1, governance);
        assert.include(await access.issuers(), acc1);
      });
    });

    describe('isIssuer', async () => {
      it('returns positive results', async () => {
        assert.isTrue(await access.isIssuer(issuer));
      });

      it('returns negative results', async () => {
        assert.isFalse(await access.isIssuer(governor));
        assert.isFalse(await access.isIssuer(acc2));
        assert.isFalse(await access.isIssuer(actor));
      });
    });

    describe('removeIssuer', () => {
      itThrows('called from an unknown account', MUST_BE_GOVERNOR, async () => {
        await access.removeIssuer(issuer, { from: acc1 });
      });
      itThrows('called from an actor account', MUST_BE_GOVERNOR, async () => {
        await access.removeIssuer(issuer, { from: actor });
      });

      it('removes a governor', async () => {
        await access.addIssuer(acc1, governance);
        assert.include(await access.issuers(), acc1);
        await access.removeIssuer(acc1, governance);
        assert.notInclude(await access.issuers(), acc1);
      });
    });
  });

  describe('governance functions', () => {
    describe('addGovernor', () => {
      itThrows('called from an unknown account', MUST_BE_GOVERNOR, async () => {
        await access.addGovernor(governor, { from: acc1 });
      });
      itThrows('called from an actor account', MUST_BE_GOVERNOR, async () => {
        await access.addGovernor(governor, { from: actor });
      });
      itThrows('double-adding', DUPLICATED_ADDRESS, async () => {
        await access.addGovernor(governor, governance);
      });

      it('allows governors to add governors', async () => {
        await access.addGovernor(acc1, governance);
        assert.include(await access.governors(), acc1);
      });
    });

    describe('isGovernor', async () => {
      it('returns positive results', async () => {
        assert.isTrue(await access.isGovernor(governor));
      });

      it('returns negative results', async () => {
        assert.isFalse(await access.isGovernor(acc2));
        assert.isFalse(await access.isGovernor(actor));
      });
    });

    describe('removeGovernor', () => {
      itThrows('called from an unknown account', MUST_BE_GOVERNOR, async () => {
        await access.removeGovernor(governor, { from: acc1 });
      });
      itThrows('called from an actor account', MUST_BE_GOVERNOR, async () => {
        await access.removeGovernor(governor, { from: actor });
      });
      itThrows('self-removing', SELF_TERMINATION, async () => {
        await access.removeGovernor(governor, governance);
      });

      it('removes a governor', async () => {
        await access.addGovernor(acc1, governance);
        assert.include(await access.governors(), acc1);
        await access.removeGovernor(acc1, governance);
        assert.notInclude(await access.governors(), acc1);
      });
    });
  });

  describe('enrolment functions', () => {
    describe('isActor', async () => {
      it('returns positive results', async () => {
        assert.isTrue(await access.isActor(actor));
      });

      it('returns negative results', async () => {
        assert.isFalse(await access.isActor(acc1));
        assert.isFalse(await access.isActor(acc2));
      });
    });

    describe('addActor', () => {
      itThrows('called from an unknown account', MUST_BE_GOVERNOR, async () => {
        await access.addActor(governor, { from: acc1 });
      });
      itThrows('called from an actor account', MUST_BE_GOVERNOR, async () => {
        await access.addActor(governor, { from: actor });
      });
      itThrows('double-adding', DUPLICATED_ADDRESS, async () => {
        await access.addActor(actor, governance);
      });

      it('allows governors to add actors', async () => {
        await access.addActor(acc1, governance);
        assert.include(await access.actors(), acc1);
      });
    });

    describe('removeActor', () => {
      itThrows('called from an unknown account', MUST_BE_GOVERNOR, async () => {
        await access.removeActor(actor, { from: acc1 });
      });
      itThrows('called from an actor account', MUST_BE_GOVERNOR, async () => {
        await access.removeActor(actor, { from: actor });
      });

      it('removes an actor', async () => {
        await access.addActor(acc1, governance);
        assert.include(await access.actors(), acc1);
        await access.removeActor(acc1, governance);
        assert.notInclude(await access.actors(), acc1);
      });
    });
  });

  describe('end-to-end', () => {});
});
