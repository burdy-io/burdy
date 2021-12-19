import { EntityManager, getManager } from 'typeorm';
import UnauthorizedError from '@server/errors/unauthorized-error';
import express from 'express';
import ForbiddenError from '@server/errors/forbidden-error';
import AccessToken from '@server/models/access-token';
import SiteSettings from '@server/models/site-settings.model';

type IContentMiddlewareOptions = {
  alwaysAuthorize?: boolean;
};

export const verifyContentToken = async ({
  token,
  entityManager,
}: {
  token: string;
  entityManager: EntityManager;
}): Promise<void> => {
  const accessToken = await entityManager.getRepository(AccessToken).findOne({
    where: {
      token,
    },
  });
  if (!accessToken) throw new UnauthorizedError('unauthorized');
};

export const extractContentToken = (req: express.Request): string | undefined => {
  return req?.headers?.['x-content-token'] as string || req?.query?.['x-content-token'] as string;
}

const contentMiddleware =
  (options?: IContentMiddlewareOptions) =>
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const entityManager = getManager();
      const token = extractContentToken(req);
      if (options?.alwaysAuthorize) {
        await verifyContentToken({
          token,
          entityManager,
        });
      } else {
        const apiAccess = await entityManager
          .getRepository(SiteSettings)
          .findOne({
            where: {
              key: 'apiAccess',
            },
          });
        if (apiAccess?.value === 'private')
          await verifyContentToken({
            token,
            entityManager,
          });
      }
      return next();
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return next(error);
      }
      return next(new UnauthorizedError('unauthorized'));
    }
  };

export default contentMiddleware;
