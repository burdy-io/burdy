import BaseError from '@server/errors/base-error';

export default class BadRequestError extends BaseError {
  protected status = 400;
}
