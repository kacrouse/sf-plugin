import { promises as fs } from 'node:fs';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';
import { JsonMap } from '@salesforce/ts-types';
import { withFile } from 'tmp-promise';
import getStdin from 'get-stdin';
import { ApexExecuteOptions, ExecuteService, ExecuteAnonymousResponse } from '@salesforce/apex-node';
import _ from 'lodash';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sf-plugin', 'kac.apex.execute');

type ExecuteResult = ExecuteRunResult | DryRunResult;
type ExecuteRunResult = {
  compiled: boolean;
  success: boolean;
  line: number;
  column: number;
  exceptionStackTrace: string;
  compileProblem: string;
  logs: string | undefined;
  exceptionMessage: string;
};
type DryRunResult = {
  script: string;
};

// todo: there's probably more cleaning to do
const sanitize = (text: string): string => text?.replaceAll("'", "\\'").replaceAll('\n', '\\n');
const contextVarsApex = (stdin: string, args: JsonMap): string =>
  `final Map<String, String> args = (Map<String, String>) JSON.deserialize('${sanitize(
    JSON.stringify(args)
  )}', Map<String, String>.class);\nfinal String stdin = '${sanitize(stdin)}';`;
const addContext = (context: string, script: string): string => `${context}\n${script}`;
const countLines = (text: string): number => text.split('\n').length;
const debugOnly = (log: string): string =>
  log
    // debug statements can have newlines in them so this craziness is required
    // ?= is a positive lookahead, so it asserts that the timestamp is at the
    // beginning of the line, but does not include the timestamp in the separator
    .split(/\n(?=\d{2}:\d{2}:\d{2}\.\d{1,3} \(\d+\)\|)/)
    .filter((line) => line.includes('|USER_DEBUG|'))
    // grab the debug portion, unescape pipe chars
    .map((line) => line.split('|')[4].replaceAll('&#124;', '|'))
    .join('\n');

const formatJson = (response: ExecuteAnonymousResponse): ExecuteRunResult => ({
  success: response.success,
  compiled: response.compiled,
  compileProblem: response.diagnostic?.[0].compileProblem ?? '',
  exceptionMessage: response.diagnostic?.[0].exceptionMessage ?? '',
  exceptionStackTrace: response.diagnostic?.[0].exceptionStackTrace ?? '',
  line: response.diagnostic?.[0].lineNumber ?? -1,
  column: response.diagnostic?.[0].columnNumber ?? -1,
  logs: response.logs,
});

export default class ExecuteApex extends SfCommand<ExecuteResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly examples = messages.getMessages('examples');
  public static readonly flags = {
    file: Flags.file({ char: 'f', summary: messages.getMessage('flags.file.summary'), required: true }),
    'dry-run': Flags.boolean({ char: 'r', summary: messages.getMessage('flags.dry-run.summary') }),
    'debug-only': Flags.boolean({ char: 'd', summary: messages.getMessage('flags.debug-only.summary'), default: true }),
    key: Flags.string({ char: 'k', summary: messages.getMessage('flags.key.summary'), multiple: true }),
    value: Flags.string({ char: 'v', summary: messages.getMessage('flags.value.summary'), multiple: true }),
    'target-org': Flags.requiredOrg(),
    'api-version': Flags.orgApiVersion(),
  };

  public async run(): Promise<ExecuteResult> {
    const { flags } = await this.parse(ExecuteApex);

    const contextVars = contextVarsApex(
      (await getStdin()) || '',
      _.zip(flags.key, flags.value).reduce(
        (acc, [k, v]) => ({
          ...acc,
          [k ?? '']: v,
        }),
        {}
      )
    );

    // todo: handle errors with reading file
    const decoratedScript = addContext(contextVars, await fs.readFile(flags.file, 'utf8'));
    if (flags['dry-run']) {
      this.log(decoratedScript);
      return { script: decoratedScript };
    }

    const conn = flags['target-org'].getConnection(flags['api-version']);
    const exec = new ExecuteService(conn);

    const result = await withFile(async ({ path }: { path: string }) => {
      // todo: handle errors with writing file
      await fs.writeFile(path, decoratedScript);
      const execAnonOptions: ApexExecuteOptions = {
        apexFilePath: path,
      };
      return exec.executeAnonymous(execAnonOptions);
    });

    const formattedResult = formatJson(result);

    if (!result.compiled || !result.success) {
      const err = !result.compiled
        ? new SfError(
            messages.getMessage('executeCompileFailure', [
              formattedResult.line - countLines(contextVars),
              formattedResult.column,
              formattedResult.compileProblem,
            ]),
            'executeCompileFailure'
          )
        : new SfError(
            messages.getMessage('executeRuntimeFailure', [formattedResult.exceptionMessage]),
            'executeRuntimeFailure',
            []
          );
      err.setData(formattedResult);
      throw err;
    }

    const output = flags['debug-only'] ? debugOnly(result.logs ?? '') : result.logs;
    this.log(output);
    return formattedResult;
  }
}
