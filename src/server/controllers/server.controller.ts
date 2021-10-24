import express from 'express';
import { getManager, getRepository } from 'typeorm';
import SiteSettings from '@server/models/site-settings.model';
import User from '@server/models/user.model';
import asyncMiddleware from '@server/middleware/async.middleware';
import BadRequestError from '@server/errors/bad-request-error';
import { UserStatus } from '@shared/interfaces/model';
import Group from '@server/models/group.model';
import Validators from '@shared/validators';
import { getEnhancedRepository } from '@server/common/orm-helpers';
import { getExpires, sign } from '@server/common/jwt';
import UserSession from '@server/models/user-session.model';
import { exportContent, importContent } from '@server/business-logic/server.bl';
import authMiddleware from '@server/middleware/auth.middleware';

const app = express();

app.get(
  '/init',
  asyncMiddleware(async (req, res) => {
    const siteSettingsRepository = getRepository(SiteSettings);

    const initiated = await siteSettingsRepository.findOne({
      where: { key: 'initiated' },
    });

    if (initiated) throw new BadRequestError('site_initiated');

    res.send();
  })
);

app.post(
  '/init',
  asyncMiddleware(async (req, res) => {
    const siteSettingsRepository = getRepository(SiteSettings);
    const userRepository = getEnhancedRepository(User);
    const groupRepository = getRepository(Group);
    const userSessionRepository = getRepository(UserSession);

    const [initiated, userCount] = await Promise.all([
      siteSettingsRepository.findOne({ where: { key: 'initiated' } }),
      userRepository.count(),
    ]);

    if (initiated || userCount > 0) throw new BadRequestError('site_initiated');

    await req.validate({
      email: Validators.email(),
      password: Validators.password(),
      firstName: Validators.firstName(),
      lastName: Validators.lastName(),
    });

    const { email, password, firstName, lastName } = req.body;

    const adminGroup = await groupRepository.findOne({
      where: { name: 'Admin' },
    });

    let user = await userRepository.create({
      email,
      firstName,
      lastName,
      status: UserStatus.ACTIVE,
      groups: [adminGroup],
    });

    await user.setPassword(password);

    let siteSettings = siteSettingsRepository.create([
      { key: 'initiated', value: true },
      { key: 'adminEmail', value: email },
    ]);

    let token;
    await getManager().transaction(async (entityManager) => {
      user = await entityManager.save(user);
      siteSettings = await entityManager.save(siteSettings);

      const userSession = await entityManager.save(
        userSessionRepository.create({
          user,
          expiresAt: getExpires(),
        })
      );

      token = sign({
        sessionId: userSession.id,
        userId: user.id,
      });

      res.cookie('token', token, {
        maxAge: getExpires().getTime() * 1000,
        httpOnly: true,
      });
    });

    res.send({ user, token });
  })
);

app.post(
  '/export',
  // authMiddleware(),
  asyncMiddleware(async (req, res) => {
    await exportContent();
    res.send('ok');
  })
);

app.post(
  '/import',
  // authMiddleware(),
  asyncMiddleware(async (req, res) => {
    await importContent({
      user: req?.data?.user,
      options: {
        force: req?.query?.force as string,
      },
    });
    res.send('ok');
  })
);

export default app;
