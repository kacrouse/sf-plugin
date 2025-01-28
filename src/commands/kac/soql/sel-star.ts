import { spawn } from 'node:child_process';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sf-plugin', 'kac.soql.sel-star');
const ResultFormat = {
  Human: 'human',
  CSV: 'csv',
  JSON: 'json',
};
const quote = (value: string): string => `"${value}"`;

export type KacSoqlSelStarResult = object;

export default class KacSoqlSelStar extends SfCommand<KacSoqlSelStarResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly examples = messages.getMessages('examples');
  public static readonly flags = {
    sobject: Flags.string({ char: 's', summary: messages.getMessage('flags.sobject.summary'), required: true }),
    where: Flags.string({ char: 'w', summary: messages.getMessage('flags.where.summary'), default: '' }),
    'result-format': Flags.string({
      char: 'r',
      summary: messages.getMessage('flags.result-format.summary'),
      options: Object.values(ResultFormat),
      default: ResultFormat.Human,
    }),
    'target-org': Flags.requiredOrg(),
    'api-version': Flags.orgApiVersion(),
  };

  public async run(): Promise<KacSoqlSelStarResult> {
    const { flags } = await this.parse(KacSoqlSelStar);

    const conn = flags['target-org'].getConnection(flags['api-version']);
    const { fields } = await conn.sobject(flags.sobject).describe();
    let query = `SELECT ${fields.map((f) => f.name).join(',')} FROM ${flags.sobject}`;
    if (flags.where) {
      query += ` WHERE ${flags.where}`;
    }

    spawn(
      `sfdx force:data:soql:query -r ${quote(flags['result-format'])} -q ${quote(query)} -u ${quote(
        conn.getUsername() ?? ''
      )}`,
      {
        shell: true,
        stdio: 'inherit',
      }
    );
    return {};
  }
}
