import BN from 'bn.js';

export const itThrows = (reason: string, exp: string, fun: any) => {
  it(`throws when ${reason}`, async () => {
    let error: Error | null = null;
    try {
      await Promise.resolve(fun()).catch(e => {
        error = e;
      });
    } catch (e) {
      error = e;
    }

    // No error was returned or raised - make the test fail plain and simple.
    if (!error) {
      assert.ok(false, 'expected to throw, did not');
      return;
    }

    if (error.message.length > 0) {
      // Get the error message from require method within the contract
      const errorReason = error.message.match('Reason given: (.*)\\.');
      // If there's no message error provided, check for default errors
      if (errorReason === null) {
        assert.ok(
          error.message.indexOf(exp) >= 0,
          `threw the wrong exception type: ${error.message}`
        );
      } else {
        assert.equal(exp, errorReason[1], 'threw the wrong exception type');
      }
    } else {
      throw 'NOPE';
    }
  });
};

export const assertNumberEquality = (
  a: number | string | number[] | Uint8Array | Buffer | BN,
  b: number | string | number[] | Uint8Array | Buffer | BN
) => {
  assert.equal(new BN(a).toString(), new BN(b).toString());
};
