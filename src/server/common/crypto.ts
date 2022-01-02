import * as bcrypt from 'bcryptjs';
import defer from 'defer-promise';

const roundsDef = 10;

const hash = async (string, rounds?) => {
  const deferred = defer<string>();

  bcrypt.hash(string, rounds || roundsDef, (err, hashString) => {
    if (err) return deferred.reject(err);
    return deferred.resolve(hashString);
  });

  return deferred.promise;
};

const hashSync = (string, rounds?) => {
  return bcrypt.hashSync(string, rounds || roundsDef);
};

const compare = async (string, hashString) => {
  const deferred = defer<boolean>();

  bcrypt.compare(string, hashString, (err, result) => {
    if (err) {
      deferred.resolve(false);
    } else {
      deferred.resolve(Boolean(result));
    }
  });

  return deferred.promise;
};

const compareSync = (string, hashString) =>
  bcrypt.compareSync(string, hashString);

export { hash, compare, hashSync, compareSync };
