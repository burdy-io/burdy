import React, { createContext, useContext, useEffect, useState } from 'react';
import { UseAsyncReturn } from 'react-async-hook';
import { IAccessToken } from '@shared/interfaces/model';
import apiAxios, { useApiCallback } from '@admin/helpers/api';
import ExtendedSelection, { useSelection } from '@admin/helpers/selection';
import { ModelState, useModelState } from '@admin/helpers/hooks';

export interface IApiSecurityContext {
  selection: ExtendedSelection<IAccessToken>;
  accessTokensState: ModelState<IAccessToken>;
  accessTokens: IAccessToken[];
  selectedAccessTokens: IAccessToken[];
  listAccessTokens: UseAsyncReturn<IAccessToken[], []>;
  generateAccessToken: UseAsyncReturn<IAccessToken, [name: string]>;
  deleteAccessTokens: UseAsyncReturn<number[], [ids: number[]]>;
}

const ApiSecurityContext = createContext<IApiSecurityContext>({} as any);

export interface IApiSecurityContextProviderProps {}

const ApiSecurityContextProvider: React.FC<IApiSecurityContextProviderProps> =
  ({ children }) => {
    const [selectedAccessTokens, setSelectedAccessTokens] = useState<
      IAccessToken[]
    >([]);

    const selection = useSelection<IAccessToken>({
      onSelectionChanged: () => {
        setSelectedAccessTokens(selection.getSelection());
      },
      getKey: (backup) => backup.id,
    });

    const accessTokensState = useModelState<IAccessToken>([], (a, b) => {
      return b.id - a.id;
    });

    useEffect(() => {
      // Refresh selection
      selection.setItems(accessTokensState.arrayState, false);
      setSelectedAccessTokens(selection.getSelection());
    }, [accessTokensState.arrayState]);

    const listAccessTokens = useApiCallback(async () => {
      const response = await apiAxios.get('/access-tokens');
      accessTokensState.setArrayState(response.data);
      return response;
    });

    const generateAccessToken = useApiCallback(async (name: string) => {
      const response = await apiAxios.post(
        `/access-tokens`,
        {
          name,
        }
      );
      accessTokensState.create([response?.data]);
      return response;
    });

    const deleteAccessTokens = useApiCallback(async (ids: number[]) => {
      const response = await apiAxios.delete(`/access-tokens`, {
        data: ids
      });
      accessTokensState.delete(ids);
      return response;
    });

    return (
      <ApiSecurityContext.Provider
        value={{
          listAccessTokens,
          deleteAccessTokens,
          generateAccessToken,
          selection,
          accessTokensState,
          accessTokens: accessTokensState.arrayState,
          selectedAccessTokens,
        }}
      >
        {children}
      </ApiSecurityContext.Provider>
    );
  };

const useApiSecurity = () => useContext(ApiSecurityContext);

export { ApiSecurityContextProvider, useApiSecurity };
