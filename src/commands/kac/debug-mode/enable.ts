import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sf-plugin', 'kac.debug-mode.enable');

type EnableDebugModeResult = {
  userId: string;
  success: boolean;
};

export default class EnableDebugMode extends SfCommand<EnableDebugModeResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly examples = messages.getMessages('examples');
  public static readonly flags = {
    'target-user': Flags.string({ char: 'u', summary: messages.getMessage('flags.target-user.summary') }),
    'target-org': Flags.requiredOrg(),
    'api-version': Flags.orgApiVersion(),
  };

  public async run(): Promise<EnableDebugModeResult> {
    const { flags } = await this.parse(EnableDebugMode);
    const conn = flags['target-org'].getConnection(flags['api-version']);
    const username = flags['target-user'] ?? (await conn.identity()).username;
    this.log(messages.getMessage('info.enablingDebugMode', [username]));
    const query = `SELECT Id, UserPreferencesUserDebugModePref FROM User WHERE Username = '${username}' LIMIT 1`;
    const result = await conn.query<{ Id: string; UserPreferencesUserDebugModePref: boolean }>(query);
    if (result.records.length === 0) {
      throw new SfError(messages.getMessage('error.userNotFound', [username]), 'UserNotFound');
    }
    const user = result.records[0];
    if (user.UserPreferencesUserDebugModePref) {
      this.log(messages.getMessage('info.debugModeAlreadyEnabled', [username]));
      return { userId: user.Id, success: true };
    }
    user.UserPreferencesUserDebugModePref = true;
    const updateResult = await conn.sobject('User').update(user);
    if (updateResult.success) {
      this.log(messages.getMessage('info.debugModeEnabled', [username]));
      return { userId: user.Id, success: true };
    }
    throw new SfError(messages.getMessage('error.debugModeEnableFailed', [username, updateResult.errors.join(', ')]));
  }
}
