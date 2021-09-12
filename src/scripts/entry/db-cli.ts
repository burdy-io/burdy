import '../util/env.util';
import Hooks from '@shared/features/hooks';
import { getConnectionManager } from 'typeorm';
import { getDatabaseType } from '@scripts/util/database.util';

(async () => {
  require('../../index');
  const entities = await Hooks.applyFilters('db/models', []);

  const connectionManager = getConnectionManager();
  const originalCreate = connectionManager.create;
  connectionManager.create = function(options) {
    const databaseType = getDatabaseType(options.type);
    return originalCreate.call(this, {
      ...options,
      entities,
      type: databaseType as any
    });
  };

  require('typeorm/cli');
})();
