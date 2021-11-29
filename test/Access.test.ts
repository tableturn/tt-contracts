import { AccessInstance } from '../types/truffle-contracts';
import { itThrows } from './helpers/helpers';
import {
  MUST_BE_GOVERNOR,
  DUPLICATED_ADDRESS,
  DOUBLE_INIT,
  SELF_TERMINATION,
  ZERO_ADDRESS,
  MUST_BE_GOVERNOR_OR_AUTOMATON
} from './helpers/errors';
import { assert } from 'chai';

const Access = artifacts.require('Access');

contract('Access', accounts => {
  const [, issuer, governor, actor, automaton, acc1, acc2, acc3] = accounts;
  const governance = { from: governor };
  var access: AccessInstance;

  beforeEach(async () => {
    access = await Access.new();
    await access.initialize(governor);
    await access.addIssuer(issuer, governance);
    await access.addActor(actor, governance);
    await access.addAutomaton(automaton, governance);
  });

  describe('initializer', () => {
    itThrows('called more than once', DOUBLE_INIT, async () => {
      await access.initialize(governor);
    });

    it('should add the zero address so that transfers can be made internally from the reserve', async () => {
      assert.include(await access.actors(), ZERO_ADDRESS);
    })

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

  describe('governors functions', () => {
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
      itThrows('called from an unknown account', MUST_BE_GOVERNOR_OR_AUTOMATON, async () => {
        await access.addActor(governor, { from: acc1 });
      });
      itThrows('called from an actor account', MUST_BE_GOVERNOR_OR_AUTOMATON, async () => {
        await access.addActor(governor, { from: actor });
      });
      itThrows('double-adding', DUPLICATED_ADDRESS, async () => {
        await access.addActor(actor, governance);
      });

      it('allows governors to add actors', async () => {
        await access.addActor(acc1, governance);
        assert.include(await access.actors(), acc1);
      });

      it('allows automatons to add actors', async () => {
        await access.addActor(acc2, { from: automaton });
        assert.include(await access.actors(), acc2);
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

  describe('automatons functions', () => {
    describe('addAutomaton', () => {
      itThrows('called from an unknown account', MUST_BE_GOVERNOR, async () => {
        await access.addAutomaton(governor, { from: acc1 });
      });
      itThrows('called from an actor account', MUST_BE_GOVERNOR, async () => {
        await access.addAutomaton(governor, { from: actor });
      });
      itThrows('called from an automaton account', MUST_BE_GOVERNOR, async () => {
        await access.addAutomaton(governor, { from: automaton });
      });
      itThrows('double-adding', DUPLICATED_ADDRESS, async () => {
        await access.addAutomaton(automaton, governance);
      });

      it('allows governors to add automatons', async () => {
        await access.addAutomaton(acc1, governance);
        assert.include(await access.automatons(), acc1);
      });
    });

    describe('isAutomaton', async () => {
      it('returns positive results', async () => {
        assert.isTrue(await access.isAutomaton(automaton));
      });

      it('returns negative results', async () => {
        assert.isFalse(await access.isAutomaton(acc2));
        assert.isFalse(await access.isAutomaton(actor));
      });
    });

    describe('removeAutomaton', () => {
      itThrows('called from an unknown account', MUST_BE_GOVERNOR, async () => {
        await access.removeAutomaton(automaton, { from: acc1 });
      });
      itThrows('called from an actor account', MUST_BE_GOVERNOR, async () => {
        await access.removeAutomaton(automaton, { from: actor });
      });

      it('removes an automaton', async () => {
        await access.addAutomaton(acc1, governance);
        assert.include(await access.automatons(), acc1);

        await access.removeAutomaton(acc1, governance);
        assert.notInclude(await access.governors(), acc1);
      });
    });
  });

  describe('flags and setFlags', () => {
    itThrows('setter is called from an non-governor account', MUST_BE_GOVERNOR, async () => {
      await access.setFlags(acc1, {
        isActor: false,
        isGovernor: false,
        isIssuer: false,
        isAutomaton: false
      }, { from: actor })
    });

    [
      [false, false, false, false],
      [true, false, false, false],
      [false, true, false, false],
      [false, false, true, false],
      [false, false, false, true],
      [true, true, false, false],
      [true, false, true, false],
      [true, false, false, true],
      [false, true, true, false],
      [false, true, false, true],
      [false, false, true, true],
    ].forEach(([issuer, governor, actor, automaton]) => {
      it(`works for combination issuer=${issuer}, governor=${governor}, actor=${actor}, automaton=${automaton}`, async () => {
        const expFlags = { isIssuer: issuer, isGovernor: governor, isActor: actor, isAutomaton: automaton };
        await access.setFlags(acc3, expFlags, governance);
        const f = await access.flags(acc3);
        assert.deepEqual(expFlags, {
          isIssuer: f.isIssuer,
          isGovernor: f.isGovernor,
          isActor: f.isActor,
          isAutomaton: f.isAutomaton
        })
      })
    })
  });
});
