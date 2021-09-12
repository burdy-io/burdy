import BaseError from '@server/errors/base-error';

export default class UnauthorizedError extends BaseError {
  protected status = 401;
}
