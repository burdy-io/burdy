import '../util/env.util';
import { connectDatabaseDriver } from '@server/drivers/database.driver';
import { launch } from '@shared/features/server';
import Hooks from '@shared/features/hooks';
import express, { Express } from 'express';
import PathUtil from '@scripts/util/path.util';
import { connectMailDriver } from '@server/drivers/mail.driver';

// Safe to compile as it won't import webpack
(async () => {
  Hooks.addAction(
    'server/init',
    async (app: Express) => {
      app.use('/admin', express.static(PathUtil.build('admin')));
      app.get('/admin/*', (req, res) => {
        res.sendFile(PathUtil.build('admin', 'index.html'));
      });
    },
    { id: 'core/runWebpack' }
  );

  require('../../index');
  await Promise.all([connectDatabaseDriver(), connectMailDriver()]);
  await launch();
})();
