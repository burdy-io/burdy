import express from 'express';
import asyncMiddleware from '@server/middleware/async.middleware';
import { getPermissions } from '@shared/features/permissions';

const app = express();

app.get(
  '/permissions',
  asyncMiddleware(async (req, res) => {
    const permissions = await getPermissions();
    res.send(permissions);
  })
);

export default app;
