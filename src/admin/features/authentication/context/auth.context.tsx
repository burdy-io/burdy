import { IUser, IUserToken } from '@shared/interfaces/model';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAsyncCallback, UseAsyncReturn } from 'react-async-hook';
import { useHistory } from 'react-router';
import apiAxios, { useApiCallback } from '@admin/helpers/api';

interface AuthContextInterface {
  user: IUser;
  logIn: UseAsyncReturn<
    { user: IUser; token: IUserToken },
    [{ email: string; password: string }]
  >;
  logOut: UseAsyncReturn<any, []>;
  forgot: UseAsyncReturn<any, [{ email: string }]>;
  forgotVerify: UseAsyncReturn<any, [{ token: string; password: string }]>;
  init: UseAsyncReturn<
    void,
    [{ email: string; password: string; meta?: object }]
  >;
  updatePassword: UseAsyncReturn<
    any,
    [{ currentPassword: string; password: string; confirmPassword: string }]
  >;
  filterPermissions: (list: any[]) => any[];
  hasPermission: (list?: string[]) => boolean;
  needsInit: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextInterface>({} as any);

const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  const logIn = useApiCallback(async ({ email, password }) => {
    const response = await apiAxios.post('/login', { email, password });
    setUser(response?.data?.user);
    history.replace('/');
    return response;
  });

  const logOut = useApiCallback(async () => {
    const response = await apiAxios.post('/logout');
    setUser(undefined);
    history.replace('/login');
    return response;
  });

  const loggedIn = useAsyncCallback(async () => {
    try {
      const res = await apiAxios.get('/loggedIn');
      setUser(res?.data);
    } catch (e) {
      // silent
    }
  });

  const forgot = useApiCallback(async ({ email }) =>
    apiAxios.post('/forgot', { email })
  );

  const forgotVerify = useAsyncCallback(async ({ token, password }) =>
    apiAxios.post('/forgot/verify', { token, password })
  );

  const needsInit = useAsyncCallback(async () => {
    try {
      await apiAxios.get('/init');
      return true;
    } catch (e) {
      return false;
    }
  });

  const init = useApiCallback(async (data) => {
    const res = await apiAxios.post('/init', data);
    setUser(res?.data?.user);
    history.replace('/');
    return res;
  });

  const load = useAsyncCallback(async () => {
    setLoading(true);

    await Promise.all([loggedIn.execute(), needsInit.execute()]);

    setLoading(false);
  });

  const updatePassword = useApiCallback(
    async ({ currentPassword, password, confirmPassword }) =>
      apiAxios.post('/profile/change-password', {
        currentPassword,
        password,
        confirmPassword,
      })
  );

  useEffect(() => {
    load.execute();

    apiAxios.interceptors.response.use(undefined, async (err) => {
      const { response } = err;

      if (response.status === 401) {
        setUser(undefined);
        history.replace('/login');
      }

      return Promise.reject(err);
    });
  }, []);

  const filterPermissions = (array: any[]): any[] => {
    const permissions = (user?.groups || []).reduce((acc, group) => {
      return [...(acc || []), ...(group?.permissions || [])];
    }, []);

    const find = (val) =>
      !!permissions.find((permission) => permission === val);

    if (find('all')) return array;
    return array.filter(
      (item) =>
        !(item as any)?.permissions ||
        ((item as any)?.permissions || []).some(find)
    );
  };

  const hasPermission = (array: string[]): boolean => {
    const permissions = (user?.groups || []).reduce((acc, group) => {
      return [...(acc || []), ...(group?.permissions || [])];
    }, []);

    const find = (val) =>
      !!permissions.find((permission) => permission === val);

    return find('all') || (array || []).some((permission) => find(permission));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        logIn,
        loading,
        logOut,
        forgot,
        forgotVerify,
        needsInit: needsInit.result,
        init,
        updatePassword,
        filterPermissions,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

export { AuthContext, AuthContextProvider, useAuth };
