import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import { UseAsyncReturn } from 'react-async-hook';
import { IBackup, IContentType, IUser } from '@shared/interfaces/model';
import apiAxios, { useApiCallback } from '@admin/helpers/api';
import ExtendedSelection, { ItemsOrKeys, useSelection } from '@admin/helpers/selection';
import { SelectionMode } from '@fluentui/react';
import {ModelState, useModelState} from "@admin/helpers/hooks";

export interface IBackupContext {
  list: UseAsyncReturn<IBackup[], []>;
  get: UseAsyncReturn<IBackup, [id: number]>;
  create: UseAsyncReturn<IBackup, [partial: Partial<IBackup>]>;
  download: (id: number) => void;
  remove: UseAsyncReturn<null, [id: number]>;

  selectedBackups: IBackup[];
  selection: ExtendedSelection<IBackup>;

  backupState: ModelState<IBackup>;
  backups: IBackup[];
}

const BackupContext = createContext<IBackupContext>({} as any);

export interface IBackupContextProviderProps {
  defaultSelectedBackups?: ItemsOrKeys<IBackup>;
  selectionMode?: SelectionMode;
}

const BackupContextProvider: React.FC<IBackupContextProviderProps> = ({
  children,
  selectionMode = SelectionMode.single,
  defaultSelectedBackups = [],
}) => {
  const [selectedBackups, setSelectedBackups] = useState<IBackup[]>([]);
  const selection = useSelection<IBackup>({
    onSelectionChanged: () => {
      setSelectedBackups(selection.getSelection());
    },
    getKey: (backup) => backup.id,
    selectionMode,
    defaultSelectedItems: defaultSelectedBackups,
  });

  const backupState = useModelState<IBackup>([], (a, b) => {
    return b.id - a.id;
  });

  useEffect(() => {
    // Refresh selection
    selection.setItems(backupState.arrayState, false);
    setSelectedBackups(selection.getSelection());
  }, [backupState.arrayState]);


  const list = useApiCallback(async () => {
    const response = await apiAxios.get('/backups');
    backupState.setArrayState(response.data);
    return response;
  });

  const get = useApiCallback(async (id: number) =>
    apiAxios.get(`/backups/${id}`)
  );

  const remove = useApiCallback(async (id: number) => {
    const response = await apiAxios.delete(`/backups/${id}`);
    backupState.delete([id]);
    return response;
  });

  const create = useApiCallback(async (partial: Partial<IBackup>) => {
    const response = await apiAxios.post(`/backups`, partial);
    backupState.create([response.data]);
    return response;
  });

  const download = useCallback((id: number) => {
    window.open(`/backups/download/${id}`, '_blank');
  }, []);

  return (
    <BackupContext.Provider
      value={{
        get,
        list,
        remove,
        create,
        download,
        selectedBackups,
        selection,
        backupState,
        backups: backupState.arrayState
      }}
    >
      {children}
    </BackupContext.Provider>
  );
};

const useBackups = () => useContext(BackupContext);

export { BackupContextProvider, useBackups };
