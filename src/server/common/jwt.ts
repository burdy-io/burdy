import jwt from 'jsonwebtoken';
import { addSeconds } from 'date-fns';

const secret = process.env.JWT_SECRET || 'P@SSw0rd';
const alg = process.env.JWT_ALG || 'HS512';
const expires = (process.env.JWT_EXPIRES as any as number) || 31556952;

const sign = (payload: any, exp?) => {
  return jwt.sign(payload, secret, {
    expiresIn: exp || expires,
    algorithm: alg,
  });
};

const verify = (token: string) => {
  return jwt.verify(token, secret);
};

const getExpires = () => {
  return addSeconds(new Date(), expires);
};

export { sign, verify, getExpires };
