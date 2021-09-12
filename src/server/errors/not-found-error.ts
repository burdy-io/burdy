import BaseError from '@server/errors/base-error';

export default class NotFoundError extends BaseError {
  protected status = 404;
}
