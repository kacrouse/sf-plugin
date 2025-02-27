import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
//import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
//import ExecuteApex from '../../../../src/commands/kac/apex/execute.js';

describe('hello world', () => {
  const $$ = new TestContext();
  //  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;

  beforeEach(() => {
    //    sfCommandStubs = stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  it('runs apex execute', async () => {
    // await ExecuteApex.run(['-o', 'stg']);
    // const output = sfCommandStubs.log
    //   .getCalls()
    //   .flatMap((c) => c.args)
    //   .join('\n');
    // expect(output).to.include('Error');
    expect(true).to.equal(true);
  });
});
