import React, { createContext, useContext, useState } from 'react';
import { UseAsyncReturn } from 'react-async-hook';
import { IContentType } from '@shared/interfaces/model';
import apiAxios, { useApiCallback } from '@admin/helpers/api';

export interface ISettingsContext {
  open: boolean;
  setOpen: (value: boolean) => void;
  getMainSettings: UseAsyncReturn<{ adminEmail: string }, []>;
  updateMainSettings: UseAsyncReturn<any, [{ adminEmail: string }]>;
  getContentTypes: UseAsyncReturn<IContentType[], [params?: any]>;
}

const SettingsContext = createContext<ISettingsContext>({} as any);

const SettingsContextProvider = ({ children }) => {
  const [open, setOpen] = useState(false);

  const getMainSettings = useApiCallback(async () =>
    apiAxios.get('/settings/main')
  );

  const updateMainSettings = useApiCallback(async (data) =>
    apiAxios.post('/settings/main', data)
  );

  const getContentTypes = useApiCallback(async (params) =>
    apiAxios.get('/content-types', {
      params,
    })
  );

  return (
    <SettingsContext.Provider
      value={{
        open,
        setOpen,
        getMainSettings,
        updateMainSettings,
        getContentTypes,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

const useSettings = () => useContext(SettingsContext);

export { SettingsContextProvider, useSettings };
