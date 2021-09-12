import { Mutex, MutexInterface } from 'async-mutex';
import {
  ColumnType,
  Connection,
  ConnectionManager,
  ConnectionOptions,
  QueryRunner,
} from 'typeorm';
import { Driver } from 'typeorm/driver/Driver';
import { DriverFactory } from 'typeorm/driver/DriverFactory';
import { BetterSqlite3QueryRunner } from 'typeorm/driver/better-sqlite3/BetterSqlite3QueryRunner';
import { BetterSqlite3Driver } from 'typeorm/driver/better-sqlite3/BetterSqlite3Driver';
import {ColumnMetadata} from "typeorm/metadata/ColumnMetadata";

const mutex = new Mutex();

class BetterSqliteQueryRunner extends BetterSqlite3QueryRunner {
  private releaser: MutexInterface.Releaser | null;

  private releaseMutex() {
    if (this.releaser) {
      this.releaser();
      this.releaser = null;
    }
  }

  async startTransaction(): Promise<void> {
    this.releaser = await mutex.acquire();
    return super.startTransaction();
  }

  async commitTransaction(): Promise<void> {
    await super.commitTransaction();
    this.releaseMutex();
  }

  async rollbackTransaction(): Promise<void> {
    await super.rollbackTransaction();
    this.releaseMutex();
  }

  release(): Promise<void> {
    if (!this.isTransactionActive) {
      this.releaseMutex();
    }

    return super.release();
  }
}

class BetterSqliteDriver extends BetterSqlite3Driver {
  supportedDataTypes: ColumnType[] = [
    'int',
    'integer',
    'tinyint',
    'smallint',
    'mediumint',
    'bigint',
    'unsigned big int',
    'int2',
    'int8',
    'integer',
    'character',
    'varchar',
    'varying character',
    'nchar',
    'native character',
    'nvarchar',
    'text',
    'clob',
    'text',
    'blob',
    'real',
    'double',
    'double precision',
    'float',
    'real',
    'numeric',
    'decimal',
    'boolean',
    'date',
    'time',
    'datetime',
    'json',
  ];

  createQueryRunner(mode: 'master' | 'slave' = 'master'): QueryRunner {
    if (mode === 'slave') {
      return new BetterSqliteQueryRunner(this);
    }
    if (!this.queryRunner) {
      this.queryRunner = new BetterSqliteQueryRunner(this);
    }
    return this.queryRunner;
  }

  preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
    if (columnMetadata.type === 'json') {
      return JSON.stringify(value);
    }

    return super.preparePersistentValue(value, columnMetadata);
  }

  prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
    if (columnMetadata.type === 'json') {
      return typeof value === "string" ? JSON.parse(value) : value;
    }

    return super.prepareHydratedValue(value, columnMetadata);
  }

  normalizeType(column: {
    type?: ColumnType;
    length?: number | string;
    precision?: number | null;
    scale?: number;
  }): string {
    if (column.type === 'json') {
      return 'text';
    }

    return super.normalizeType(column);
  }
}

class DriverFactoryPatched extends DriverFactory {
  create(connection: Connection): Driver {
    const type = connection.options.type;
    if (type.includes('sqlite')) {
      return new BetterSqliteDriver(connection);
    }
    return super.create(connection);
  }
}

class ConnectionPatched extends Connection {
  constructor(connectionOptions: ConnectionOptions) {
    super(connectionOptions);
    const that = this as any;
    that.driver = new DriverFactoryPatched().create(this);
  }
}

// Provides SQLite transaction pool and forces better-sqlite3 to be used
export const sqlitePatch = () => {
  const createConnection = ConnectionManager.prototype.create;
  ConnectionManager.prototype.create = function (options) {
    const defaultConnection = createConnection.apply(this, [
      options,
    ]) as Connection;
    const connection = new ConnectionPatched(options);

    (this.connectionMap as Map<string, Connection>).set(
      defaultConnection.name,
      connection
    );

    return connection;
  };
};
