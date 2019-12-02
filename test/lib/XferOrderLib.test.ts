import { XferOrderLibTesterInstance } from '../../types/truffle-contracts';
import { assertNumberEquality, itThrows } from '../helpers/helpers';
import { OWNER_SAME_AS_RECIPIENT, INVALID_ORDER, INVALID_ORDER_INDEX } from '../helpers/errors';
import { BAD_ID, ONE } from '../helpers/constants';

const XferOrderLibTester = artifacts.require('XferOrderLibTester');

contract('XferOrderLib', accounts => {
  const [_, acc1, acc2, acc3, acc4] = accounts;
  let t: XferOrderLibTesterInstance;
  let id1: string, id2: string, id3: string, id4: string;

  before(async () => {
    t = await XferOrderLibTester.new();
    await t.create(acc1, acc1, acc2, '100');
    id1 = await t.idByOwnerAndIndex(acc1, (await t.count(acc1)).sub(ONE));
    await t.create(acc1, acc2, acc3, '200');
    id2 = await t.idByOwnerAndIndex(acc1, (await t.count(acc1)).sub(ONE));
    await t.create(acc3, acc2, acc1, '300');
    id3 = await t.idByOwnerAndIndex(acc3, (await t.count(acc3)).sub(ONE));
    await t.create(acc3, acc4, acc1, '400');
    id4 = await t.idByOwnerAndIndex(acc3, (await t.count(acc3)).sub(ONE));
  });

  describe('create', async () => {
    itThrows('owner is the same as the recipient', OWNER_SAME_AS_RECIPIENT, async () => {
      await t.create(acc1, acc2, acc1, '1000');
    });

    it('adds the id to the order itself', async () => {
      const { id } = await t.byId(id3);
      assert.equal(id3, id);
    });

    it('adds the order to both owner and recipient but not spender', async () => {
      const [c1, c2, c3, c4] = await Promise.all([acc1, acc2, acc3, acc4].map(acc => t.count(acc)));
      assertNumberEquality(c1, '4');
      assertNumberEquality(c2, '1');
      assertNumberEquality(c3, '3');
      assertNumberEquality(c4, '0');
    });
  });

  describe('generateId', async () => {
    it('is deterministic', async () => {
      const id = await t.generateId(acc3, '1');
      assert.equal(id, id3);
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
    it('counts properly orders for owners and recipients', async () => {
      const [c1, c2, c3, c4] = await Promise.all([acc1, acc2, acc3, acc4].map(acc => t.count(acc)));
      assertNumberEquality(c1, '4');
      assertNumberEquality(c2, '1');
      assertNumberEquality(c3, '3');
      assertNumberEquality(c4, '0');
    });
  });

  describe('idByOwnerAndIndex', async () => {
    itThrows('the owner is invalid', INVALID_ORDER_INDEX, async () => {
      await t.idByOwnerAndIndex(acc4, '0');
    });
    itThrows('the index is invalid', INVALID_ORDER_INDEX, async () => {
      await t.idByOwnerAndIndex(acc1, '42');
    });

    it('returns a proper index when it exists', async () => {
      const id = await t.idByOwnerAndIndex(acc1, '1');
      assert.equal(id, id2);
    });

    it('allows the retrieval of the same index regardless of the party being queried', async () => {
      const [a, b] = await Promise.all(
        [
          [acc1, '0'],
          [acc2, '0']
        ].map(([acc, index]) => t.idByOwnerAndIndex(acc, index))
      );
      assert.equal(a, b);
    });
  });

  describe('byOwnerAndIndex', async () => {
    itThrows('the owner is invalid', INVALID_ORDER_INDEX, async () => {
      await t.byOwnerAndIndex(acc4, '0');
    });
    itThrows('the index is invalid', INVALID_ORDER_INDEX, async () => {
      await t.byOwnerAndIndex(acc1, '42');
    });

    describe('returns the requested order', async () => {
      it('when the parameter is the owner', async () => {
        const { owner, recipient, amount } = await t.byOwnerAndIndex(acc1, '0');
        assert.equal(owner, acc1);
        assert.equal(recipient, acc2);
        assertNumberEquality(amount, '100');
      });

      it('when the parameter is the recipient', async () => {
        const { owner, recipient, amount } = await t.byOwnerAndIndex(acc1, '3');
        assert.equal(owner, acc3);
        assert.equal(recipient, acc1);
        assertNumberEquality(amount, '400');
      });
    });
  });

  describe('byId', async () => {
    itThrows('the id is invalid', INVALID_ORDER, async () => {
      await t.byId(BAD_ID);
    });

    it('returns the requested order', async () => {
      const { id, owner, recipient, amount } = await t.byId(id3);
      assert.equal(id, id3);
      assert.equal(owner, acc3);
      assert.equal(recipient, acc1);
      assertNumberEquality(amount, '300');
    });
  });
});
