import BaseError from '@server/errors/base-error';
import { ValidationError } from 'yup';
import { FindRelationsNotFoundError } from 'typeorm';

const errorMiddleware = async (err, req, res, next) => {
  if (err instanceof BaseError) {
    return res.status(err.getStatusCode()).send(err.toJson());
  }

  if (err instanceof ValidationError) {
    res.status(400).send(err);
  }

  if (err instanceof FindRelationsNotFoundError) {
    res.status(400).send(err.message);
  }

  console.log(err); // TODO log
  return res.status(500).send();
};

export default errorMiddleware;
