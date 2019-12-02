import { XferGrantLibTesterInstance } from '../../types/truffle-contracts';
import { assertNumberEquality, itThrows } from '../helpers/helpers';
import { OWNER_SAME_AS_RECIPIENT, INVALID_GRANT, INVALID_GRANT_INDEX } from '../helpers/errors';
import { BAD_ID, ONE } from '../helpers/constants';

const XferGrantLibTester = artifacts.require('XferGrantLibTester');

contract('XferGrantLib', accounts => {
  const [_, acc1, acc2, acc3, acc4] = accounts;
  let t: XferGrantLibTesterInstance;
  let id1: string, id2: string, id3: string, id4: string;

  before(async () => {
    t = await XferGrantLibTester.new();
    await t.create(acc1, acc2, '100');
    id1 = await t.idByOwnerAndIndex(acc1, (await t.count(acc1)).sub(ONE));
    await t.create(acc1, acc3, '200');
    id2 = await t.idByOwnerAndIndex(acc1, (await t.count(acc1)).sub(ONE));
    await t.create(acc3, acc1, '300');
    id3 = await t.idByOwnerAndIndex(acc3, (await t.count(acc3)).sub(ONE));
    await t.create(acc3, acc1, '400');
    id4 = await t.idByOwnerAndIndex(acc3, (await t.count(acc3)).sub(ONE));
  });

  describe('create', async () => {
    itThrows('owner is the same as the recipient', OWNER_SAME_AS_RECIPIENT, async () => {
      await t.create(acc1, acc1, '1000');
    });

    it('adds the id to the grant itself', async () => {
      const { id } = await t.byId(id3);
      assert.equal(id3, id);
    });

    it('adds the grant to the owner', async () => {
      const [c1, c2, c3] = await Promise.all([acc1, acc2, acc3].map(acc => t.count(acc)));
      assertNumberEquality(c1, '2');
      assertNumberEquality(c2, '0');
      assertNumberEquality(c3, '2');
    });
  });

  describe('generateId', async () => {
    it('is deterministic', async () => {
      const id = await t.generateId(acc3, '1');
      assert.equal(id, id4);
      assert.lengthOf(id, 66);
    });

    it('generates different ids for different owners', async () => {
      assert.notEqual(id1, id3);
    });

    it('generates different ids for different indices', async () => {
      const [id1, id2] = await Promise.all(['0', '1'].map(index => t.generateId(acc1, index)));
      assert.notEqual(id1, id2);
    });
  });

  describe('count', async () => {
    it('counts properly grants for owners and recipients', async () => {
      const [c1, c2, c3] = await Promise.all([acc1, acc2, acc3].map(acc => t.count(acc)));
      [
        [c1, '2'],
        [c2, '0'],
        [c3, '2']
      ].map(([count, exp]) => assertNumberEquality(count, exp));
    });
  });

  describe('idByOwnerAndIndex', async () => {
    itThrows('the owner is invalid', INVALID_GRANT_INDEX, async () => {
      await t.idByOwnerAndIndex(acc4, '0');
    });
    itThrows('the index is invalid', INVALID_GRANT_INDEX, async () => {
      await t.idByOwnerAndIndex(acc1, '42');
    });

    it('returns a proper index when it exists', async () => {
      const id = await t.idByOwnerAndIndex(acc1, '1');
      assert.equal(id, id2);
    });
  });

  describe('byOwnerAndIndex', async () => {
    itThrows('the owner is invalid', INVALID_GRANT_INDEX, async () => {
      await t.byOwnerAndIndex(acc4, '0');
    });
    itThrows('the index is invalid', INVALID_GRANT_INDEX, async () => {
      await t.byOwnerAndIndex(acc1, '42');
    });

    describe('returns the requested grant', async () => {
      it('when the parameter is the owner', async () => {
        const { owner, recipient, maxAmount } = await t.byOwnerAndIndex(acc1, '0');
        assert.equal(owner, acc1);
        assert.equal(recipient, acc2);
        assertNumberEquality(maxAmount, '100');
      });
    });
  });

  describe('byId', async () => {
    itThrows('the id is invalid', INVALID_GRANT, async () => {
      await t.byId(BAD_ID);
    });

    it('returns the requested grant', async () => {
      const { id, owner, recipient, maxAmount } = await t.byId(id3);
      assert.equal(id, id3);
      assert.equal(owner, acc3);
      assert.equal(recipient, acc1);
      assertNumberEquality(maxAmount, '300');
    });
  });
});
