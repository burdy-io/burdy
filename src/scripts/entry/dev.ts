import '../util/env.util';
import { connectDatabaseDriver } from '@server/drivers/database.driver';
import { launch } from '@shared/features/server';
import { connectMailDriver } from '@server/drivers/mail.driver';
import Hooks from '@shared/features/hooks';
import { Express } from 'express';
import httpProxy from 'http-proxy';

(async () => {
  Hooks.addAction(
    'server/init',
    async (app: Express) => {
      const proxy = httpProxy.createProxyServer();

      app.get(['/admin/*', '/admin'], (req, res) => {
        proxy.web(req, res, { target: `http://localhost:${process.env.ADMIN_PORT}/` }, (err) => {
          console.error(err);
        });
      });
    },
    { id: 'core/runWebpack' }
  );

  require('../../index');
  await Promise.all([connectDatabaseDriver()]);
  await launch();
})();
