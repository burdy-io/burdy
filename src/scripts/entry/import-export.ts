import '../util/env.util';
import { connectDatabaseDriver } from '@server/drivers/database.driver';
import { exportContent, importContent } from '@server/business-logic/server.bl';
import ConsoleOutput from '@scripts/util/console-output.util';
import PathUtil from '@scripts/util/path.util';

declare const ACTION: string;
declare const FILE: string;
declare const FORCE: boolean;

const handleImport = async () => {
  await importContent({
    options: { force: FORCE },
    file: PathUtil.processRoot(FILE),
  });
};

const handleExport = async () => {
  await exportContent({ output: PathUtil.processRoot(FILE), force: FORCE });
};

(async () => {
  require('../../index');

  await connectDatabaseDriver();

  switch (ACTION) {
    case 'import':
      await handleImport();
      break;
    case 'export':
      await handleExport();
      break;
    default:
      ConsoleOutput.info('Not action specified.');
  }
})();
