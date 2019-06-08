import { AccountableMockInstance } from '../types/truffle-contracts';
import { itThrows, assertNumberEquality } from './helpers';
import BN from 'bn.js';
import { INSUFFICIENT_FUNDS, ADDITION_OVERFLOW, INSUFFICIENT_FROZEN_FUNDS } from './errors';

const AccountableMock = artifacts.require('AccountableMock');
const MAX_UINT256 = new BN(2).pow(new BN(256)).sub(new BN(1));

contract('AccountableMock', accounts => {
  var mock: AccountableMockInstance;

  before(async () => {
    mock = await AccountableMock.new();
  });

  describe('credit', () => {
    itThrows('overflowing', ADDITION_OVERFLOW, async () => {
      await mock.setFirst(MAX_UINT256, '0');
      await mock.credit('5');
    });

    it('adds to the account liquid balance', async () => {
      await mock.setFirst('0', '0');
      await mock.credit('500');
      const first = await mock.getFirst();
      assertNumberEquality(first.liquid, '500');
      assertNumberEquality(first.frozen, '0');
    });
  });

  describe('debit', () => {
    itThrows('there is insuficient liquid funds', INSUFFICIENT_FUNDS, async () => {
      await mock.setFirst('5000', '0');
      await mock.debit('5001');
    });

    it('subtracts from the account liquid balance', async () => {
      await mock.setFirst('5000', '0');
      await mock.debit('2500');
      const first = await mock.getFirst();
      assertNumberEquality(first.liquid, '2500');
      assertNumberEquality(first.frozen, '0');
    });
  });

  describe('freeze', () => {
    itThrows('there is insuficient liquid funds', INSUFFICIENT_FUNDS, async () => {
      await mock.setFirst('5000', '0');
      await mock.freeze('5001');
    });
    itThrows('the frozen balance would have overflown', ADDITION_OVERFLOW, async () => {
      await mock.setFirst('5000', MAX_UINT256);
      await mock.freeze('1');
    });

    it('subtracts from the account liquid balance and adds to the frozen one', async () => {
      await mock.setFirst('5000', '10');
      await mock.freeze('50');
      const first = await mock.getFirst();
      assertNumberEquality(first.liquid, '4950');
      assertNumberEquality(first.frozen, '60');
    });
  });

  describe('unfreeze', () => {
    itThrows('there is insuficient frozen funds (self)', INSUFFICIENT_FROZEN_FUNDS, async () => {
      await mock.setFirst('0', '50');
      await mock.unfreezeSelf('51');
    });
    itThrows('the liquid balance would have overflown (self)', ADDITION_OVERFLOW, async () => {
      await mock.setFirst(MAX_UINT256, '1');
      await mock.unfreezeSelf('1');
    });

    itThrows('there is insuficient frozen funds (other)', INSUFFICIENT_FROZEN_FUNDS, async () => {
      await mock.setFirst('0', '50');
      await mock.setSecond('0', '5000');
      await mock.unfreezeOther('51');
    });
    itThrows('the liquid balance would have overflown (other)', ADDITION_OVERFLOW, async () => {
      await mock.setFirst('0', '10');
      await mock.setSecond(MAX_UINT256, '0');
      await mock.unfreezeOther('1');
    });

    it('adds to the account liquid balance while subtrating from the frozen one', async () => {
      await mock.setFirst('50', '5000');
      await mock.unfreezeSelf('2000');
      const first = await mock.getFirst();
      assertNumberEquality(first.liquid, '2050');
      assertNumberEquality(first.frozen, '3000');
    });
    it('can perform over two accounts', async () => {
      await mock.setFirst('50', '5000');
      await mock.setSecond('10', '10');
      await mock.unfreezeOther('2000');
      const [first, second] = await Promise.all([mock.getFirst(), mock.getSecond()]);
      assertNumberEquality(first.liquid, '50');
      assertNumberEquality(first.frozen, '3000');
      assertNumberEquality(second.liquid, '2010');
      assertNumberEquality(second.frozen, '10');
    });
  });

  describe('transfer', () => {
    itThrows('there is insuficient liquid funds', INSUFFICIENT_FUNDS, async () => {
      await mock.setFirst('50', '5000');
      await mock.setSecond('5000', '5000');
      await mock.transfer('51');
    });
    itThrows('the liquid balance would have overflown', ADDITION_OVERFLOW, async () => {
      await mock.setFirst('1', '5000');
      await mock.setSecond(MAX_UINT256, '5000');
      await mock.transfer('1');
    });

    it('operates on both accounts liquid balances', async () => {
      await mock.setFirst('50', '5000');
      await mock.setSecond('10', '2000');
      await mock.transfer('15');
      const [first, second] = await Promise.all([mock.getFirst(), mock.getSecond()]);
      assertNumberEquality(first.liquid, '35');
      assertNumberEquality(first.frozen, '5000');
      assertNumberEquality(second.liquid, '25');
      assertNumberEquality(second.frozen, '2000');
    });
  });
});
