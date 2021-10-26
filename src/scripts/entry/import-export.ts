import '../util/env.util';
import Hooks from '@shared/features/hooks';
import { getConnectionManager } from 'typeorm';
import { getDatabaseType } from '@scripts/util/database.util';
import {connectDatabaseDriver} from "@server/drivers/database.driver";
import {exportContent} from "@server/business-logic/server.bl";
import ConsoleOutput from "@scripts/util/console-output.util";

declare const ACTION: string;
declare const OUTPUT: string;
declare const FORCE: boolean;

const handleImport = async () => {

}

const handleExport = async () => {
  await exportContent({ output: OUTPUT, force: true });
}

(async () => {
  require('../../index');

  console.log({action: ACTION, force: FORCE, output: OUTPUT});
  await connectDatabaseDriver();

  switch(ACTION) {
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
