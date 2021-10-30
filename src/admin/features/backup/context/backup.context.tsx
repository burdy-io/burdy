import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAsyncCallback, UseAsyncReturn } from 'react-async-hook';
import { IBackup } from '@shared/interfaces/model';
import apiAxios, { useApiCallback } from '@admin/helpers/api';
import ExtendedSelection, {
  ItemsOrKeys,
  useSelection,
} from '@admin/helpers/selection';
import { SelectionMode } from '@fluentui/react';
import { ModelState, useModelState } from '@admin/helpers/hooks';
import { v4 as uuid } from 'uuid';
import axios from 'axios';

type Arrayable<T> = T | T[];

interface IFileWithData {
  file: File;
  data?: any;
}

interface IUpload {
  status?: 'uploading' | 'done';
  name?: string;
  progress?: number;
}

interface IUploads {
  [key: string]: IUpload;
}

export interface IBackupContext {
  list: UseAsyncReturn<IBackup[], []>;
  get: UseAsyncReturn<IBackup, [id: number]>;
  create: UseAsyncReturn<IBackup, [partial: Partial<IBackup>]>;
  download: (id: number) => void;
  remove: UseAsyncReturn<null, [id: number]>;

  restore: UseAsyncReturn<any, [id: number, force?: boolean]>;

  selectedBackups: IBackup[];
  selection: ExtendedSelection<IBackup>;

  upload: UseAsyncReturn<any, [Arrayable<IFileWithData>]>;
  uploads: IUploads;

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
  const [uploads, setUploads] = useState<IUploads>({});

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
    window.open(
      `${apiAxios.defaults.baseURL}/backups/download/${id}`,
      '_blank'
    );
  }, []);

  const restore = useApiCallback(async (id: number, force = false) =>
    apiAxios.post(`/backups/restore`, {
      id,
      force,
    })
  );

  const upload = useAsyncCallback(
    async (filesWithData: Arrayable<IFileWithData>) => {
      if (!Array.isArray(filesWithData)) {
        filesWithData = [filesWithData];
      }

      const promises = filesWithData.map<Promise<void>>((fileWithData) =>
        (async () => {
          const { file } = fileWithData;
          const id = uuid();
          const formData = new FormData();
          const name = (file as any)?.path || (file as any)?.webkitRelativePath || file?.name || id;

          setUploads((prevState) => ({
            ...prevState,
            [id]: {
              name,
              progress: 0,
              status: 'uploading',
            },
          }));

          const onUploadProgress = (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setUploads((prevState) => ({
              ...prevState,
              [id]: {
                ...((prevState || {})[id] || {}),
                status: 'uploading',
                progress,
              },
            }));
          };

          formData.append('file', file);

          await axios.post('/api/backups/import', formData, { onUploadProgress });
          setUploads(({[id]: _, ...state}) => state);
        })()
      );

      await Promise.all(promises);

      // Now lets diff the state
      const response = await axios.get('/api/backups');
      backupState.setArrayState(response.data);
      return response?.data;
    }
  );

  return (
    <BackupContext.Provider
      value={{
        get,
        list,
        remove,
        create,
        download,
        restore,
        selectedBackups,
        selection,
        backupState,
        backups: backupState.arrayState,
        upload,
        uploads
      }}
    >
      {children}
    </BackupContext.Provider>
  );
};

const useBackups = () => useContext(BackupContext);

export { BackupContextProvider, useBackups };
