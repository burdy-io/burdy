import express from 'express';
import { DeepPartial, getManager, getRepository } from 'typeorm';
import User from '@server/models/user.model';
import UserSession from '@server/models/user-session.model';
import { getExpires, sign } from '@server/common/jwt';
import authMiddleware from '@server/middleware/auth.middleware';
import asyncMiddleware from '@server/middleware/async.middleware';
import BadRequestError from '@server/errors/bad-request-error';
import { sendMail } from '@server/drivers/mail.driver';
import UserToken, { UserTokenType } from '@server/models/user-token.model';
import * as yup from 'yup';
import { UserStatus } from '@shared/interfaces/model';
import { addDays } from 'date-fns';
import NotFoundError from '@server/errors/not-found-error';
import {
  createRelationsArray,
  getEnhancedRepository,
  queryRelationsArray,
} from '@server/common/orm-helpers';
import _ from 'lodash';
import async from 'async';
import Validators from '@shared/validators';
import { hasPermissions } from '@shared/features/permissions';
import Hooks from "@shared/features/hooks";
import SiteSettings from "@server/models/site-settings.model";

const app = express();

app.get(
  '/loggedIn',
  asyncMiddleware(async (req, res, next) => {
    const siteSettingsRepository = getRepository(SiteSettings);

    const initiated = await siteSettingsRepository.findOne({
      where: { key: 'initiated' },
    });

    if (!initiated) {
      throw new BadRequestError('not_initiated');
    }

    return next();
  }),
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const { user } = req.data;

    res.send(user);
  })
);

app.post(
  '/login',
  asyncMiddleware(async (req, res) => {
    await req.validate({ email: Validators.email() });

    const { email, password } = req.body;
    const userRepository = getRepository(User);
    const userSessionRepository = getRepository(UserSession);

    const user = await userRepository.createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.groups', 'groups')
      .leftJoinAndSelect('user.meta', 'meta')
      .where('user.email = :email', {email: email.toLowerCase()})
      .getOne();

    await req.validate({
      email: Validators.email().test(
        'email-not-found',
        'Email not found.',
        () => user !== undefined
      ),
      password: Validators.password(),
    });

    if (user.status !== UserStatus.ACTIVE)
      throw new BadRequestError('inactive_user');

    const result = await user.comparePassword(password);

    if (!result) throw new BadRequestError('invalid_password');

    const userSession = await userSessionRepository.save({
      user,
      expiresAt: getExpires(),
    });

    const token = sign({
      sessionId: userSession.id,
      userId: user.id,
    });

    res.cookie('token', token, {
      maxAge: getExpires().getTime() * 1000,
      httpOnly: true,
    });


    await Hooks.doAction('user/postLogin', user);
    res.send({ user, token });
  })
);

app.all(
  '/logout',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const { user, session } = req.data;

    if (!session) throw new BadRequestError('not_logged_in');

    const userSessionRepository = getRepository(UserSession);
    await userSessionRepository.delete({ id: session?.id });

    res.clearCookie('token');

    await Hooks.doAction('user/postLogout', user);
    res.send();
  })
);

// Forgot is opened to public
app.post(
  '/forgot',
  asyncMiddleware(async (req, res) => {
    await req.validate({ email: Validators.email() });

    const { email } = req.body;
    const userRepository = getRepository(User);

    if (req.data?.user) throw new BadRequestError('logged_in');

    const user = await userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) throw new BadRequestError('invalid_email');

    await getManager().transaction(async (entityManager) => {
      const userTokenRepository = getEnhancedRepository(
        UserToken,
        entityManager
      );

      const token = await userTokenRepository.save({
        expiresAt: addDays(new Date(), 7),
        type: UserTokenType.RESET,
        user,
      });

      sendMail({
        subject: 'Forgot Password',
        from: 'test@burdy.io',
        to: email,
        html: JSON.stringify(token),
      });
    });

    res.send();
  })
);

app.post(
  '/forgot/verify',
  asyncMiddleware(async (req, res) => {
    await req.validate({ password: Validators.password() });

    const { token, password } = req.body;

    const userTokenRepository = getEnhancedRepository(UserToken);
    const userSessionRepository = getEnhancedRepository(UserSession);

    const userToken = await userTokenRepository.findOne({
      relations: ['user'],
      where: { token, type: UserTokenType.RESET },
    });

    if (!userToken) throw new BadRequestError('invalid_token');

    const { user } = userToken;
    await user.setPassword(password);

    await getManager().transaction(async (entityManager) => {
      await entityManager.save(user);
      await entityManager.remove(userToken);
    });

    userSessionRepository.delete({ user });

    res.send();
  })
);

app.post(
  '/forgot/reset',
  asyncMiddleware(async (req, res) => {
    const { uuid, userId, password } = req.body;

    await req.validate({ password: Validators.password() });

    await getManager().transaction(async (entityManager) => {
      const userTokenRepository = getEnhancedRepository(
        UserToken,
        entityManager
      );

      const userToken = await userTokenRepository.findOne({
        relations: ['user'],
        where: {
          uuid,
          user: { id: userId },
        },
      });

      if (!userToken) throw new BadRequestError('invalid_token');

      const { user } = userToken;

      await user.setPassword(password);
      await user.save();
      await userToken.remove();

      res.send(user);
    });
  })
);

app.get(
  '/users',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const { search } = req.query;
    const userRepository = getRepository(User);

    const query = userRepository.createQueryBuilder('user');
    queryRelationsArray(query, req.query?.expand);

    if (!hasPermissions(req?.data?.user, ['all', 'users_administration'])) {
      query.where(`user.id = :id`, {id: req?.data?.user?.id})
    }
    if (search) {
      query.where('user.email like :search', { search: `%${search}%` });
    }

    if (typeof req.query.notIn === 'string') {
      query.where('user.id not in (:...ids)', {
        ids: req.query.notIn.split(','),
      });
    }

    if (typeof req.query.in === 'string') {
      query.where('user.id in (:...ids)', { ids: req.query.in.split(',') });
    }

    let users = await query.getMany();
    users = await Hooks.applyFilters('user/getMany', users);

    res.send(users);
  })
);

app.post(
  '/users',
  authMiddleware(['users_administration']),
  asyncMiddleware(async (req, res) => {
    const { groups, meta, password, ...userParams } = _.pick(req.body, [
      'email',
      'firstName',
      'lastName',
      'meta',
      'password',
      'status',
      'groups',
    ]);

    await req.validate({
      email: Validators.email().test(
        'email-exists',
        'Email taken.',
        async () => {
          const userRepository = getRepository(User);
          const user = await userRepository.findOne({
            where: { email: userParams.email?.toLowerCase?.() },
          });

          return user === undefined;
        }
      ),
      password: Validators.password(),
    });

    await getManager().transaction(async (entityManager) => {
      const userRepository = getEnhancedRepository(User, entityManager);

      const user = await userRepository.create(userParams);
      await user.setPassword(password);
      user.applyMeta(meta);

      await user.save();

      if (Array.isArray(groups)) {
        await userRepository.attach(user.id, 'groups', groups);
      }

      const userResponse = await userRepository.findOne({
        relations: ['groups', 'meta'],
        where: { id: user.id },
      });

      await Hooks.doAction('user/postCreate', userResponse);
      res.send(userResponse);
    });
  })
);

app.delete(
  '/users/:id',
  authMiddleware(['users_administration']),
  asyncMiddleware(async (req, res) => {
    const { id } = req.params;

    if (id === req.data.user.id) throw new BadRequestError('cant_delete_self');

    const userRepository = getRepository(User);
    const user = await userRepository.findOne(id);

    await user.remove();

    await Hooks.doAction('user/postDelete', user);
    res.send();
  })
);

app.delete(
  '/users',
  authMiddleware(['users_administration']),
  asyncMiddleware(async (req, res) => {
    await req.validate({
      ids: yup.array(),
    });

    const { ids } = req.body;

    if ((ids as any[]).includes(req.data.user.id))
      throw new BadRequestError('cant_delete_self');

    const userRepository = getRepository(User);
    const users = await userRepository.findByIds(ids);
    await userRepository.delete(ids);

    await Hooks.doAction('user/postDeleteMany', users);
    res.send();
  })
);

app.get(
  '/users/:id',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const { id } = req.params;
    const userRepository = getRepository(User);
    let user = await userRepository.findOne({
      relations: createRelationsArray(req.query?.expand),
      where: { id },
    });

    if (!user) throw new NotFoundError('not_found');

    user = await Hooks.applyFilters('user/get', user);
    res.send(user);
  })
);

app.put(
  '/users/',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const users: DeepPartial<User>[] = req.body;
    const newUsers: Partial<User>[] = [];

    await async.each(users, async (user, next) => {
      const { groups, meta, ...userParams } = _.pick(user, [
        'status',
        'groups',
        'meta',
        'id',
        'firstName',
        'lastName'
      ]);
      const { id } = userParams;

      await getManager().transaction(async (entityManager) => {
        const userRepository = getEnhancedRepository(User, entityManager);
        const user = await userRepository.findOne(id, { relations: ['meta'] });

        if (!user) throw new NotFoundError('not_found');

        const newUser = userRepository.merge(user, userParams);
        newUser.applyMeta(meta);

        if (Array.isArray(groups)) {
          await userRepository.sync(id, 'groups', groups as number[]);
        }

        await userRepository.save(newUser);
        const userResponse = await userRepository.findOne({
          relations: ['meta', 'groups'],
          where: { id: user.id },
        });
        newUsers.push(userResponse);
      });

      next();
    });

    res.send(newUsers);
  })
);

app.put(
  '/users/:id',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const { id } = req.params;
    const { groups, meta, ...userParams } = _.pick(req.body, [
      'status',
      'groups',
      'meta',
      'firstName',
      'lastName',
    ]);

    await getManager().transaction(async (entityManager) => {
      const userRepository = getEnhancedRepository(User, entityManager);
      const user = await userRepository.findOne(id, { relations: ['meta'] });

      if (!user) throw new NotFoundError('not_found');

      const newUser = userRepository.merge(user, userParams);
      newUser.applyMeta(meta);

      if (Array.isArray(groups)) {
        await userRepository.sync(id, 'groups', groups);
      }

      await userRepository.save(newUser);
      const userResponse = await userRepository.findOne({
        relations: ['groups', 'meta'],
        where: { id },
      });

      res.send(userResponse);
    });
  })
);

app.post(
  '/profile/change-password',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    await req.validate({ password: Validators.password() });

    const { id } = req.data.user;
    const { currentPassword, password } = req.body;

    const userRepository = await getEnhancedRepository(User);
    const user = await userRepository.createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', {id})
      .getOne();

    if (!user) throw new NotFoundError('not_found');

    const compareResult = await user.comparePassword(currentPassword);

    if (!compareResult) throw new BadRequestError('wrong_password');

    await user.setPassword(password);
    userRepository.save(user);

    res.send();
  })
);

app.post(
  '/users/reset-password/:id',
  authMiddleware(['users_administration']),
  asyncMiddleware(async (req, res) => {
    await req.validate({ password: Validators.password() });

    const { id } = req.params;
    const { password, notify } = req.body;

    const userRepository = await getEnhancedRepository(User);
    const userSessionRepository = await getEnhancedRepository(UserSession);

    const user = await userRepository.findOne(id);

    if (!user) throw new NotFoundError('not_found');

    await user.setPassword(password);
    userRepository.save(user);

    if (notify) {
      // @TODO issue an email
    }

    userSessionRepository.delete({ user });
    res.send();
  })
);

export default app;
