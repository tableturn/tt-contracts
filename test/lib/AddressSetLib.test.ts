import { AddressSetLibTesterInstance } from '../../types/truffle-contracts';
import { itThrows, assertNumberEquality } from '../helpers/helpers';
import {
  ZERO_ADDRESS,
  ADDRESS_ALREADY_IN_SET,
  NONEXISTENT_ADDRESS
} from '../helpers/errors';

const AddressSetLibTester = artifacts.require('AddressSetLibTester');

contract('AddressSetLib', accounts => {
  const [acc1, acc2, acc3] = accounts;
  let mock: AddressSetLibTesterInstance;

  beforeEach(async () => {
    mock = await AddressSetLibTester.new();
  });

  describe('add', async () => {
    itThrows('already added', ADDRESS_ALREADY_IN_SET, async () => {
      await Promise.all([1, 2].map(() => mock.add(acc1)));
    });

    it('can add properly', async () => {
      await Promise.all([acc1, acc2, acc3].map(v => mock.add(v)));
      assert.includeMembers(await mock.getSample1Values(), [acc1, acc2, acc3]);
    });

    it('allows the zero address to be added', async () => {
      await mock.add(ZERO_ADDRESS);
      assert.includeMembers(await mock.getSample1Values(), [ZERO_ADDRESS]);
    })
  });

  describe('remove', async () => {
    itThrows('removing non-existent items', NONEXISTENT_ADDRESS, async () => {
      await mock.remove(acc1);
    });

    it('can remove properly', async () => {
      await Promise.all([acc1, acc2, acc3].map(v => mock.add(v)));
      assertNumberEquality(await mock.count(), '3');

      await mock.remove(acc1);
      assertNumberEquality(await mock.count(), '2');
      assert.includeMembers(await mock.getSample1Values(), [acc2, acc3]);
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
