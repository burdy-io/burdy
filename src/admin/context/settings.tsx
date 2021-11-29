import React, { createContext, useContext, useState } from 'react';
import { UseAsyncReturn } from 'react-async-hook';
import { IContentType, ISiteSettings } from '@shared/interfaces/model';
import apiAxios, { useApiCallback } from '@admin/helpers/api';
import { ModelState, useModelState } from '@admin/helpers/hooks';

export interface ISettingsContext {
  settingsArray: ISiteSettings[];
  settingsState: ModelState<ISiteSettings>;
  open: boolean;
  setOpen: (value: boolean) => void;
  getContentTypes: UseAsyncReturn<IContentType[], [params?: any]>;
  getSettings: UseAsyncReturn<ISiteSettings[], []>;
  updateSettings: UseAsyncReturn<ISiteSettings, [key: string, value: string]>
}

const SettingsContext = createContext<ISettingsContext>({} as any);

const SettingsContextProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const settingsState = useModelState<ISiteSettings>([]);
  const getContentTypes = useApiCallback(async (params) =>
    apiAxios.get('/content-types', {
      params,
    })
  );

  const getSettings = useApiCallback(async () => {
   const response = await apiAxios.get('/settings');
   settingsState.update(response?.data || []);
   return response;
  });

  const updateSettings = useApiCallback(async (key: string, value: string) => {
    const response = await apiAxios.post('/settings', {
      key,
      value
    });
    settingsState.update([response.data]);
    return response;
  }
);

  return (
    <SettingsContext.Provider
      value={{
        open,
        setOpen,
        getContentTypes,

        getSettings,
        updateSettings,
        settingsState,
        settingsArray: settingsState?.arrayState
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

const useSettings = () => useContext(SettingsContext);

export { SettingsContextProvider, useSettings };
