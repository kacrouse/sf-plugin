import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { DescribeGlobalResult, Optional } from '@jsforce/jsforce-node';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sf-plugin', 'kac.record.get-sobjecttype');

const findSobjectByKeyPrefix = (
  globalDescribe: DescribeGlobalResult,
  recordId: string
): SObjectDescribe | undefined => {
  const sobjectDescribe = globalDescribe.sobjects.find((obj) => obj.keyPrefix === recordId.substring(0, 3));
  if (sobjectDescribe) {
    return {
      name: sobjectDescribe.name,
      keyPrefix: sobjectDescribe.keyPrefix,
    };
  }
  return undefined;
};

type SObjectDescribe = {
  name: string;
  keyPrefix: Optional<string>;
};

export type KacRecordGetSobjecttypeResult = {
  sobjectType: string;
};

export type Cache = {
  [orgId: string]: DescribeGlobalResult;
};

export default class KacRecordGetSobjecttype extends SfCommand<KacRecordGetSobjecttypeResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'record-id': Flags.string({
      summary: messages.getMessage('flags.record-id.summary'),
      char: 'i',
      required: true,
    }),
    'target-org': Flags.requiredOrg(),
    'api-version': Flags.orgApiVersion(),
  };

  public async run(): Promise<KacRecordGetSobjecttypeResult> {
    const { flags } = await this.parse(KacRecordGetSobjecttype);

    const recordId = flags['record-id'];
    const conn = flags['target-org'].getConnection(flags['api-version']);
    const orgId = conn.getAuthInfoFields().orgId;
    if (!orgId) {
      this.error(messages.getMessage('error.noOrgId'));
    }
    const cacheDir = path.join(os.homedir(), '.sf');
    const cacheFile = path.join(cacheDir, 'kac-record-get-sobjecttype-cache.json');

    let cache: Cache = {};
    try {
      const cacheContent = await fs.readFile(cacheFile, 'utf8');
      cache = JSON.parse(cacheContent) as Cache;
    } catch {
      // ignore if cache doesn't exist
    }

    let globalDescribe: DescribeGlobalResult | undefined = cache[orgId];
    let sobject: SObjectDescribe | undefined;
    if (globalDescribe) {
      sobject = findSobjectByKeyPrefix(globalDescribe, recordId);
    }
    if (!globalDescribe || !sobject) {
      globalDescribe = await conn.describeGlobal();
      cache[orgId] = globalDescribe;
      try {
        await fs.mkdir(cacheDir, { recursive: true });
        await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2), 'utf8');
      } catch (e) {
        this.warn(messages.getMessage('warning.cacheWriteFailed', [(e as Error).message]));
      }
    }
    sobject = findSobjectByKeyPrefix(globalDescribe, recordId);

    if (!sobject) {
      this.error(messages.getMessage('error.invalidRecordId', [recordId]));
    }
    this.log(sobject.name);
    return {
      sobjectType: sobject.name,
    };
  }
}
