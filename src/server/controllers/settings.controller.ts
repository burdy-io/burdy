import express from 'express';
import asyncMiddleware from '@server/middleware/async.middleware';
import { getRepository } from 'typeorm';
import SiteSettings from '@server/models/site-settings.model';
import authMiddleware from '@server/middleware/auth.middleware';

const app = express();

app.get('/settings', authMiddleware(), asyncMiddleware(async (req, res) => {
  const settingsRepository = getRepository(SiteSettings);
  const settings = await settingsRepository.find();
  res.send(settings);
}));

app.post('/settings', authMiddleware(), asyncMiddleware(async (req, res) => {
  const settingsRepository = getRepository(SiteSettings);
  let settings = await settingsRepository.findOne({
    where: {
      key: req?.body?.key
    }
  });
  if (settings) {
    settings.value = req?.body?.value;
    await settingsRepository.save(settings);
  } else {
    settings = await settingsRepository.save({
      key: req?.body?.key,
      value: req?.body?.value
    });
  }
  res.send(settings);
}));

export default app;
