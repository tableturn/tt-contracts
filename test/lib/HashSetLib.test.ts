import { HashSetLibTesterInstance } from '../../types/truffle-contracts';
import { itThrows, assertNumberEquality } from '../helpers/helpers';
import { HASH_ALREADY_IN_SET, NONEXISTENT_HASH } from '../helpers/errors';

const HashSetLibTester = artifacts.require('HashSetLibTester');

const storedHash = (hash: string) => {
  return `${hash.toLowerCase()}000000000000000000000000`;
};

contract('HashSetLib', accounts => {
  const [acc1, acc2, acc3] = accounts;
  let mock: HashSetLibTesterInstance;

  beforeEach(async () => {
    mock = await HashSetLibTester.new();
  });

  describe('add', async () => {
    itThrows('already added', HASH_ALREADY_IN_SET, async () => {
      await Promise.all([1, 2].map(() => mock.add(acc1)));
    });

    it('can add properly', async () => {
      await Promise.all([acc1, acc2, acc3].map(v => mock.add(v)));
      assert.includeMembers(await mock.getSample1Values(), [
        storedHash(acc1),
        storedHash(acc2),
        storedHash(acc3)
      ]);
    });
  });

  describe('remove', async () => {
    itThrows('removing non-existent items', NONEXISTENT_HASH, async () => {
      await mock.remove(acc1);
    });

    it('can remove properly', async () => {
      await Promise.all([acc1, acc2, acc3].map(v => mock.add(v)));
      assertNumberEquality(await mock.count(), '3');
      await mock.remove(acc1);
      assertNumberEquality(await mock.count(), '2');
      assert.includeMembers(await mock.getSample1Values(), [storedHash(acc2), storedHash(acc3)]);
    });
  });

  describe('count', async () => {
    it('returns the items count', async () => {
      await Promise.all([acc1, acc2, acc3].map(v => mock.add(v)));
      assertNumberEquality(await mock.count(), '3');
      await mock.remove(acc1);
      assertNumberEquality(await mock.count(), '2');
    });
  });

  describe('contains', async () => {
    it('functions properly', async () => {
      assert.equal(await mock.contains(acc1), false);
      await mock.add(acc1);
      assert.equal(await mock.contains(acc1), true);
      await mock.remove(acc1);
      assert.equal(await mock.contains(acc1), false);
    });
  });
});
