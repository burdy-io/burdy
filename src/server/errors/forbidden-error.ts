import BaseError from '@server/errors/base-error';

export default class ForbiddenError extends BaseError {
  protected status = 403;
}
