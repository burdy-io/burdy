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
import PathUtil from "@scripts/util/path.util";
import fs from 'fs-extra';
import AccessToken from '@server/models/access-token';
import { nanoid } from 'nanoid';

const app = express();

app.get(
  '/health',
  asyncMiddleware(async (req, res) => {
    res.send({
      status: 'ok'
    })
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

    const accessTokenRepository = getEnhancedRepository(AccessToken);
    await accessTokenRepository.save({
      name: req?.body?.name,
      token: nanoid()
    });

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

app.get(
  '/export',
  authMiddleware(['all']),
  asyncMiddleware(async (req, res) => {
    const include = req.query?.includes ?? undefined;
    let includeTokens: string[];

    if (include) includeTokens = (include as string).split(',');

    const output = PathUtil.burdyRoot('temp-export.zip');
    await exportContent({ output, force: true, include: includeTokens })

    const readStream = fs.createReadStream(output);

    res.attachment(`export-${new Date().toISOString()}.zip`);
    res.contentType('application/zip');

    readStream.on('end', () => {
      res.end();
      fs.remove(output);
    })

    readStream.pipe(res);
  })
);

app.post(
  '/import',
  authMiddleware(['all']),
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
