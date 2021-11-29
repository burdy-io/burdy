import express, { Express } from 'express';
import Hooks from '@shared/features/hooks';
import cookieParser from 'cookie-parser';
import serverController from '@server/controllers/server.controller';
import userController from '@server/controllers/user.controller';
import groupController from '@server/controllers/group.controller';
import permissionController from '@server/controllers/permission.controller';
import assetController from '@server/controllers/asset.controller';
import postController from '@server/controllers/post.controller';
import settingsController from '@server/controllers/settings.controller';
import contentTypeController from '@server/controllers/content-type.controller';
import tagController from '@server/controllers/tag.controller';
import publicController from '@server/controllers/public.controller';
import backupController from '@server/controllers/backup.controller';
import accessTokenController from '@server/controllers/access-token.controller';

Hooks.addAction(
  'api/init',
  async (app: Express) => {
    app.use((req, res, next) => {
      const origin = req.get('origin');
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Headers', 'content-type, auth-token');
      res.header('Access-Control-Expose-Headers', 'content-type, auth-token');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH');
      next();
    });

    app.use(cookieParser(process.env.SIGNED_COOKIE));

    app.use(express.json({ limit: process.env.REQ_LIMIT }));
    app.use(express.urlencoded({ limit: process.env.REQ_LIMIT, extended: true }));

    app.use(publicController);
    app.use(contentTypeController);
    app.use(assetController);
    app.use(postController);
    app.use(permissionController);
    app.use(serverController);
    app.use(userController);
    app.use(groupController);
    app.use(settingsController);
    app.use(tagController);
    app.use(backupController);
    app.use(accessTokenController);
  },
  { id: 'core/controllers' }
);
