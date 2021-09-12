import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAsyncCallback, UseAsyncReturn } from 'react-async-hook';
import { IGroup } from '@shared/interfaces/model';
import { Selection, SelectionMode } from '@fluentui/react';
import { useModelState } from '@admin/helpers/hooks';
import apiAxios, { useApiCallback } from '@admin/helpers/api';
import { ItemsOrKeys, useSelection } from '@admin/helpers/selection';

export interface IGroupsContext {
  get: UseAsyncReturn<IGroup, [id: number]>;
  list: UseAsyncReturn<IGroup[], []>;
  create: UseAsyncReturn<any, [group: Partial<IGroup>]>;
  deleteOne: UseAsyncReturn<any, [id: number]>;
  deleteMany: UseAsyncReturn<any, [ids: number[]]>;
  update: UseAsyncReturn<any, [group: Partial<IGroup>]>;
  selection: Selection<IGroup>;
  selectedGroups: IGroup[];
  groups: IGroup[];
}

const GroupsContext = createContext<IGroupsContext>({} as any);

export interface IGroupsContextProviderProps {
  defaultSelectedGroups?: ItemsOrKeys<IGroup>;
  selectionMode?: SelectionMode;
}

const GroupsContextProvider: React.FC<IGroupsContextProviderProps> = ({
  children,
  defaultSelectedGroups = [],
  selectionMode = SelectionMode.multiple,
}) => {
  const [selectedGroups, setSelectedGroups] = useState([]);
  const groupsModelState = useModelState<IGroup>([]);

  const selection = useSelection<IGroup>({
    onSelectionChanged: () => {
      setSelectedGroups(selection.getSelection());
    },
    getKey: (group) => group.id,
    selectionMode,
    defaultSelectedItems: defaultSelectedGroups,
  });

  useEffect(() => {
    selection.setItems(groupsModelState.arrayState);
    setSelectedGroups(selection.getSelection());
  }, [groupsModelState.arrayState]);

  const get = useApiCallback(async (id: number) =>
    apiAxios.get(`/groups/${id}`, {
      params: {
        expand: 'users,users.meta',
      },
    })
  );

  const list = useApiCallback(async () => {
    const response = await apiAxios.get('/groups');
    groupsModelState.setArrayState(response.data);
    return response;
  });

  const create = useApiCallback(async (group: IGroup) => {
    const response = await apiAxios.post(`/groups`, group);
    groupsModelState.create([response.data]);
    return response;
  });

  const deleteOne = useApiCallback(async (id: number) => {
    const response = await apiAxios.delete(`/groups/${id}`);
    groupsModelState.delete([id]);
    return response;
  });

  const deleteMany = useApiCallback(async (ids: number[]) => {
    const response = await apiAxios.delete(`/groups`, { data: { ids } });
    groupsModelState.delete(ids);
    return response;
  });

  const update = useAsyncCallback(async (group: IGroup) => {
    const response = await apiAxios.put(`/groups/${group.id}`, group);
    groupsModelState.update([response.data]);
    return response;
  });

  useEffect(() => {
    list.execute();
  }, []);

  return (
    <GroupsContext.Provider
      value={{
        get,
        list,
        create,
        deleteOne,
        deleteMany,
        update,
        selection,
        selectedGroups,
        groups: groupsModelState.arrayState,
      }}
    >
      {children}
    </GroupsContext.Provider>
  );
};

const useGroups = () => useContext(GroupsContext);

export { GroupsContextProvider, useGroups };
