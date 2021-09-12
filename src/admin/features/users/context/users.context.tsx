import { UseAsyncReturn } from 'react-async-hook';
import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import { IUser } from '@shared/interfaces/model';
import { SelectionMode } from '@fluentui/react';
import apiAxios, { useApiCallback } from '@admin/helpers/api';
import { ModelState, useModelState } from '@admin/helpers/hooks';
import { withWrapper } from '@admin/helpers/hoc';
import ExtendedSelection, {
  ItemsOrKeys,
  useSelection,
} from '@admin/helpers/selection';

export interface IUsersContext {
  list: UseAsyncReturn<IUser[], []>;
  get: UseAsyncReturn<IUser, [id: number]>;
  create: UseAsyncReturn<any, [Partial<IUser & { notify?: boolean }>]>;
  deleteMany: UseAsyncReturn<any, [id: number[]]>;
  update: UseAsyncReturn<any, [id: number, params: Partial<IUser>]>;
  updateMany: UseAsyncReturn<Partial<IUser>[]>;
  resetPassword: UseAsyncReturn<{
    id: number;
    password: string;
    notify: boolean;
  }>;
  selectedUsers: IUser[];
  selection: ExtendedSelection<IUser>;
  users: IUser[];
  usersState: ModelState<IUser>;
  setListParams: Dispatch<SetStateAction<any>>;
  listParams: any;
}

export const UsersContext = createContext<IUsersContext>({} as any);

export interface IUsersContextProviderProps {
  defaultSelectedUsers?: ItemsOrKeys<IUser>;
  selectionMode?: SelectionMode;
}

const UsersContextProvider: React.FC<IUsersContextProviderProps> = ({
  children,
  defaultSelectedUsers = [],
  selectionMode = SelectionMode.multiple,
}) => {
  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
  const [listParams, setListParams] = useState<any>({});
  const usersState = useModelState<IUser>([]);

  const selection = useSelection<IUser>({
    onSelectionChanged: () => {
      setSelectedUsers(selection.getSelection());
    },
    getKey: (user) => user.id,
    selectionMode,
    defaultSelectedItems: defaultSelectedUsers,
  });

  useEffect(() => {
    // Refresh selection
    selection.setItems(usersState.arrayState, false);
    setSelectedUsers(selection.getSelection());
  }, [usersState.arrayState]);

  const list = useApiCallback(async () => {
    const response = await apiAxios.get('/users', {
      params: { expand: 'meta,groups', ...listParams },
    });
    usersState.setArrayState(response.data);
    return response;
  });

  const get = useApiCallback(async (id: number) =>
    apiAxios.get(`/users/${id}`, { params: { expand: 'meta,groups' } })
  );

  const create = useApiCallback(async (params) => {
    const response = await apiAxios.post('/users', params);
    usersState.create([response.data]);
    return response;
  });

  const deleteMany = useApiCallback(async (ids: number[]) => {
    const response = await apiAxios.delete('/users', { data: { ids } });
    usersState.delete(ids);
    return response;
  });

  const update = useApiCallback(async (id, params) => {
    const response = await apiAxios.put(`/users/${id}`, params);
    usersState.update([response.data]);
    return response;
  });

  const updateMany = useApiCallback(async (data: IUser[]) => {
    const response = await apiAxios.put('/users', data);
    usersState.update(response.data);
    return response;
  });

  const resetPassword = useApiCallback(async (data) =>
    apiAxios.post(`/users/reset-password/${data.id}`, data)
  );

  return (
    <UsersContext.Provider
      value={{
        list,
        get,
        create,
        deleteMany,
        selectedUsers,
        selection,
        update,
        updateMany,
        resetPassword,
        users: usersState.arrayState,
        usersState,
        listParams,
        setListParams,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};

const useUsers = () => useContext(UsersContext);
const withUsers = withWrapper(UsersContextProvider);

export { useUsers, withUsers, UsersContextProvider };
