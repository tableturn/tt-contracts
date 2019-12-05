import { AccountLibTesterInstance } from '../../types/truffle-contracts';
import { itThrows, assertNumberEquality } from '../helpers/helpers';
import BN from 'bn.js';
import {
  INSUFFICIENT_FUNDS,
  ADDITION_OVERFLOW,
  INSUFFICIENT_FROZEN_FUNDS
} from '../helpers/errors';
import { ONE } from '../helpers/constants';

const AccountLibTester = artifacts.require('AccountLibTester');
const MAX_UINT256 = new BN(2).pow(new BN(256)).sub(ONE);

contract('AccountLib', _accounts => {
  let mock: AccountLibTesterInstance;

  before(async () => {
    mock = await AccountLibTester.new();
  });

  describe('credit', () => {
    itThrows('overflowing', ADDITION_OVERFLOW, async () => {
      await mock.setSample1(MAX_UINT256, '0');
      await mock.credit('5');
    });

    it('adds to the account liquid balance', async () => {
      await mock.setSample1('0', '0');
      await mock.credit('500');
      const sample1 = await mock.getSample1();
      assertNumberEquality(sample1.liquid, '500');
      assertNumberEquality(sample1.frozen, '0');
    });
  });

  describe('debit', () => {
    itThrows('there is insuficient liquid funds', INSUFFICIENT_FUNDS, async () => {
      await mock.setSample1('5000', '0');
      await mock.debit('5001');
    });

    it('subtracts from the account liquid balance', async () => {
      await mock.setSample1('5000', '0');
      await mock.debit('2500');
      const sample1 = await mock.getSample1();
      assertNumberEquality(sample1.liquid, '2500');
      assertNumberEquality(sample1.frozen, '0');
    });
  });

  describe('freeze', () => {
    itThrows('there is insuficient liquid funds', INSUFFICIENT_FUNDS, async () => {
      await mock.setSample1('5000', '0');
      await mock.freeze('5001');
    });
    itThrows('the frozen balance would have overflown', ADDITION_OVERFLOW, async () => {
      await mock.setSample1('5000', MAX_UINT256);
      await mock.freeze('1');
    });

    it('subtracts from the account liquid balance and adds to the frozen one', async () => {
      await mock.setSample1('5000', '10');
      await mock.freeze('50');
      const sample1 = await mock.getSample1();
      assertNumberEquality(sample1.liquid, '4950');
      assertNumberEquality(sample1.frozen, '60');
    });
  });

  describe('unfreeze', () => {
    itThrows('there is insuficient frozen funds (self)', INSUFFICIENT_FROZEN_FUNDS, async () => {
      await mock.setSample1('0', '50');
      await mock.unfreezeSelf('51');
    });
    itThrows('the liquid balance would have overflown (self)', ADDITION_OVERFLOW, async () => {
      await mock.setSample1(MAX_UINT256, '1');
      await mock.unfreezeSelf('1');
    });

    itThrows('there is insuficient frozen funds (other)', INSUFFICIENT_FROZEN_FUNDS, async () => {
      await mock.setSample1('0', '50');
      await mock.setSample2('0', '5000');
      await mock.unfreezeOther('51');
    });
    itThrows('the liquid balance would have overflown (other)', ADDITION_OVERFLOW, async () => {
      await mock.setSample1('0', '10');
      await mock.setSample2(MAX_UINT256, '0');
      await mock.unfreezeOther('1');
    });

    it('adds to the account liquid balance while subtrating from the frozen one', async () => {
      await mock.setSample1('50', '5000');
      await mock.unfreezeSelf('2000');
      const sample1 = await mock.getSample1();
      assertNumberEquality(sample1.liquid, '2050');
      assertNumberEquality(sample1.frozen, '3000');
    });
    it('can perform over two accounts', async () => {
      await mock.setSample1('50', '5000');
      await mock.setSample2('10', '10');
      await mock.unfreezeOther('2000');
      const [sample1, sample2] = await Promise.all([mock.getSample1(), mock.getSample2()]);
      assertNumberEquality(sample1.liquid, '50');
      assertNumberEquality(sample1.frozen, '3000');
      assertNumberEquality(sample2.liquid, '2010');
      assertNumberEquality(sample2.frozen, '10');
    });
  });

  describe('transfer', () => {
    itThrows('there is insuficient liquid funds', INSUFFICIENT_FUNDS, async () => {
      await mock.setSample1('50', '5000');
      await mock.setSample2('5000', '5000');
      await mock.transfer('51');
    });
    itThrows('the liquid balance would have overflown', ADDITION_OVERFLOW, async () => {
      await mock.setSample1('1', '5000');
      await mock.setSample2(MAX_UINT256, '5000');
      await mock.transfer('1');
    });

    it('operates on both accounts liquid balances', async () => {
      await mock.setSample1('50', '5000');
      await mock.setSample2('10', '2000');
      await mock.transfer('15');
      const [sample1, sample2] = await Promise.all([mock.getSample1(), mock.getSample2()]);
      assertNumberEquality(sample1.liquid, '35');
      assertNumberEquality(sample1.frozen, '5000');
      assertNumberEquality(sample2.liquid, '25');
      assertNumberEquality(sample2.frozen, '2000');
    });
  });
});
