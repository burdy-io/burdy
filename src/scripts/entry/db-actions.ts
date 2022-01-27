import '../util/env.util';
import { connectDatabaseDriver } from '@server/drivers/database.driver';
import { exportContent, importContent } from '@server/business-logic/server.bl';
import ConsoleOutput from '@scripts/util/console-output.util';
import PathUtil from '@scripts/util/path.util';
import {DbAction, ExportAction, GenerateApiKeyAction, ImportAction} from "@scripts/interfaces/db-actions";
import { nanoid } from 'nanoid';
import {getEnhancedRepository} from "@server/common/orm-helpers";
import AccessToken from "@server/models/access-token";

declare const action: DbAction;

const handleImport = async () => {
  const { payload } = action as ImportAction;

  await importContent({
    options: { force: payload.force, publish: payload.publish },
    file: PathUtil.processRoot(payload.file),
  });
};

const handleExport = async () => {
  const { payload } = action as ExportAction;

  await exportContent({ output: PathUtil.processRoot(payload.file), force: payload.force });
};

const handleGenerateApiKey = async () => {
  const { payload } = action as GenerateApiKeyAction;
  const token = nanoid();

  const accessTokenRepository = getEnhancedRepository(AccessToken);

  await accessTokenRepository.save({
    name: payload.name,
    token,
  });

  process.stdout.write(`GENERATED_KEY="${token}"\n`);
};

(async () => {
  require('../../index');

  await connectDatabaseDriver();

  switch (action.type) {
    case 'import':
      await handleImport();
      break;
    case 'export':
      await handleExport();
      break;
    case 'generateApiKey':
      await handleGenerateApiKey();
      break;
    default:
      ConsoleOutput.info('Not action specified.');
  }
})();
