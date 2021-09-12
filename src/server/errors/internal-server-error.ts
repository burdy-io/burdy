import BaseError from '@server/errors/base-error';

export default class InternalServerError extends BaseError {
  protected status = 500;
}
