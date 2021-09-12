import logger from '@shared/features/logger';
import { RequestHandler } from 'express';

const asyncMiddleware =
  <T = any>(fn: RequestHandler<T>) =>
  (req, res, next) => {
    const data: any = {
      url: req.originalUrl,
      method: req.method,
    };

    if (req.params) {
      data.params = req.params;
    }

    if (req.body) {
      data.body = req.body;
    }

    if (req.query) {
      data.query = req.query;
    }

    logger.debug({
      type: 'BURDY_RQ',
      data,
    });

    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncMiddleware;
