import express from 'express';
import authMiddleware from '@server/middleware/auth.middleware';
import asyncMiddleware from '@server/middleware/async.middleware';
import { getEnhancedRepository } from '@server/common/orm-helpers';
import { In } from 'typeorm';
import AccessToken from '@server/models/access-token';
import { nanoid } from 'nanoid';

const app = express();

app.get(
  '/access-tokens',
  authMiddleware(['all']),
  asyncMiddleware(async (req, res) => {
    const accessTokenRepository = getEnhancedRepository(AccessToken);
    const accessTokens = await accessTokenRepository.find();
    res.send(accessTokens);
  })
);

app.post(
  '/access-tokens',
  authMiddleware(['all']),
  asyncMiddleware(async (req, res) => {
    const accessTokenRepository = getEnhancedRepository(AccessToken);
    const accessToken = await accessTokenRepository.save({
      name: req?.body?.name,
      token: nanoid()
    });
    res.send(accessToken);
  })
);

app.delete(
  '/access-tokens',
  authMiddleware(['all']),
  asyncMiddleware(async (req, res) => {
    const ids: number[] = req?.body ?? [];
    if (!ids || ids?.length === 0) return res.send([]);

    const accessTokenRepository = getEnhancedRepository(AccessToken);
    const deleted = await accessTokenRepository.delete({
      id: In(ids)
    });

    return res.send(deleted);
  })
);

export default app;
