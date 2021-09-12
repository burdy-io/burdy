import { IUser } from '@shared/interfaces/model';

const userMeta = (user: IUser, key: string) =>
  user?.meta?.find((meta) => meta.key === key)?.value;

const userPersonaText = (user: IUser) => {
  const firstName = user?.firstName ?? '';
  const lastName = user?.lastName ?? '';
  const displayName = `${firstName} ${lastName}`;

  return !displayName.trim() ? user.email : displayName;
};

interface ModelObject<T> {
  [key: number]: T;
}

const convertModelArrayToObject = <T>(
  model: T[],
  key = 'id'
): ModelObject<T> => {
  const object: ModelObject<T> = {};

  model.forEach((o) => {
    object[o[key]] = o;
  });

  return object;
};

export { userMeta, userPersonaText, ModelObject, convertModelArrayToObject };
