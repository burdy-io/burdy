import { IUser, IUserToken } from '@shared/interfaces/model';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAsyncCallback, UseAsyncReturn } from 'react-async-hook';
import { useHistory } from 'react-router';
import apiAxios, { useApiCallback } from '@admin/helpers/api';

export type AuthStatuses = 'authenticated' | 'needs-init' | 'unauthenticated';

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
  loading: boolean;
  authStatus: AuthStatuses;
  setAuthStatus: (status: AuthStatuses) => void;
}

const AuthContext = createContext<AuthContextInterface>({} as any);

const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const history = useHistory();
  const [authStatus, setAuthStatus] = useState<AuthStatuses>('unauthenticated');

  const logIn = useApiCallback(async ({ email, password }) => {
    const response = await apiAxios.post('/login', { email, password });
    setUser(response?.data?.user);
    history.replace('/');
    return response;
  });

  useEffect(() => {
    setAuthStatus(user ? 'authenticated' : 'unauthenticated');
  }, [user]);

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
      setAuthStatus('authenticated');
    } catch (e) {
      const { status } = e.response;

      if (user) {
        setUser(undefined);
      }

      if (status === 401) {
        setAuthStatus('unauthenticated');
      } else if (status === 400) {
        setAuthStatus('needs-init');
      }
    }
  });

  const forgot = useApiCallback(async ({ email }) =>
    apiAxios.post('/forgot', { email })
  );

  const forgotVerify = useAsyncCallback(async ({ token, password }) =>
    apiAxios.post('/forgot/verify', { token, password })
  );

  const init = useApiCallback(async (data) => {
    const res = await apiAxios.post('/init', data);
    setUser(res?.data?.user);
    history.replace('/');
    return res;
  });

  const load = useAsyncCallback(async () => {
    setLoading(true);

    await Promise.all([loggedIn.execute()]);

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
        init,
        updatePassword,
        filterPermissions,
        hasPermission,
        authStatus,
        setAuthStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

export { AuthContext, AuthContextProvider, useAuth };
