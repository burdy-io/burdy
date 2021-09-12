import chalk from 'chalk';
import {ConnectionOptions, createConnection, getConnectionOptions} from 'typeorm';
import { IDatabaseDriver } from '@shared/interfaces/database';
import Hooks from '@shared/features/hooks';
import { sqlitePatch } from '@server/drivers/sqlite-patch';
import { getDatabaseType } from '@scripts/util/database.util';

const databaseDriver: IDatabaseDriver = {
  connection: undefined,
};

const connectDatabaseDriver = async () => {
  try {
    const entities = await Hooks.applyFilters('db/models', []);

    const databaseType = getDatabaseType(process.env.TYPEORM_CONNECTION);

    const defaultConnectionOptions: ConnectionOptions = {
      entities,
      type: databaseType as any,
    };

    sqlitePatch();

    const connectionOptions = await Hooks.applyFilters(
      'db/options',
      defaultConnectionOptions
    );

    const typeormConnectionOptions = await getConnectionOptions();

    const connection = await createConnection({...typeormConnectionOptions, ...connectionOptions} as any);

    databaseDriver.connection = await Hooks.applyFilters('db/connection', connection);

    await Hooks.doAction('db/init', connection, connectionOptions);
    console.log(chalk.green('Connection to database established.'));
  } catch (e) {
    console.log(e);
    console.error(chalk.red('Error establishing connection to database.'));
    process.exit(1);
  }
};

export { databaseDriver, connectDatabaseDriver };
