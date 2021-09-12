import User from '@server/models/user.model';
import { verify } from '@server/common/jwt';
import { getManager } from 'typeorm';
import UnauthorizedError from '@server/errors/unauthorized-error';
import _ from 'lodash';
import Hooks from '@shared/features/hooks';
import express from 'express';
import ForbiddenError from '@server/errors/forbidden-error';

const authMiddleware =
  (permissions: string[] = []) =>
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const token = req?.cookies?.token;
      const decoded = verify(token);

      const entityManager = getManager();

      let user = await Hooks.applyFilters('auth/getUser', null, req);

      if (!user) {
        user = await entityManager
        .getRepository(User)
        .createQueryBuilder('user')
        .innerJoinAndSelect('user.sessions', 'sessions')
        .leftJoinAndSelect('user.meta', 'meta')
        .leftJoinAndSelect('user.groups', 'groups')
        .where('sessions.id = :sessionId AND user.id = :userId', {
          sessionId: decoded.sessionId,
          userId: decoded.userId,
        })
        .getOne();
      }

      if (!user) throw new Error();

      const userPermissions = await Hooks.applyFilters(
        'auth/permissions',
        _.flatMap(user?.groups ?? [], 'permissions'),
        user
      )

      const hasPermission =
        userPermissions.includes('all') ||
        permissions.every((permission) => userPermissions.includes(permission));

      const hasAccess = await Hooks.applyFilters(
        'auth/hasPermission',
        hasPermission,
        user,
        req
      );

      if (!hasAccess) throw new ForbiddenError('forbidden');

      req.data = {
        user,
        session: user.sessions.find(
          (session) => session.id === decoded.sessionId
        ),
      };

      return next();
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return next(error);
      }
      res.clearCookie('token');
      return next(new UnauthorizedError('unauthorized'));
    }
  };

export default authMiddleware;
