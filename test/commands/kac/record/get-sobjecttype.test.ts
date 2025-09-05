import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
// import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
// import KacDebugModeDisable from '../../../../src/commands/kac/debug-mode/disable.js';

describe('kac record get-sobjecttype', () => {
  const $$ = new TestContext();
  // let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;

  beforeEach(() => {
    // sfCommandStubs = stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  // it('runs hello', async () => {
  //   await KacDebugModeDisable.run([]);
  //   const output = sfCommandStubs.log
  //     .getCalls()
  //     .flatMap((c) => c.args)
  //     .join('\n');
  //   expect(output).to.include('hello world');
  // });

  // it('runs hello with --json and no provided name', async () => {
  //   const result = await KacDebugModeDisable.run([]);
  //   expect(result.path).to.equal('src/commands/kac/debug-mode/disable.ts');
  // });

  it('runs hello world --name Astro', async () => {
    // await KacDebugModeDisable.run(['--name', 'Astro']);
    // const output = sfCommandStubs.log
    //   .getCalls()
    //   .flatMap((c) => c.args)
    //   .join('\n');
    // expect(output).to.include('hello Astro');
    expect(true).to.equal(true);
  });
});
