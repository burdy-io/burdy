import { useAsyncCallback, UseAsyncReturn } from 'react-async-hook';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import axios from 'axios';
import { IAsset } from '@shared/interfaces/model';
import { v4 as uuid } from 'uuid';
import {
  ModelState,
  useModelState,
  useStorageState,
} from '@admin/helpers/hooks';
import ExtendedSelection, { useSelection } from '@admin/helpers/selection';
import querystring from 'querystring';

const FOLDER_MIME_TYPE = 'application/vnd.burdy.folder';
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type ViewTypes = 'list' | 'tiles';
type Arrayable<T> = T | T[];

interface IFileWithData {
  file: File;
  data: any;
}

interface IUpload {
  status?: 'uploading' | 'done';
  name?: string;
  progress?: number;
}

interface IUploads {
  [key: string]: IUpload;
}

interface IAssetsContext {
  getAssets: UseAsyncReturn<any, [params?: any]>;
  getAncestors: UseAsyncReturn<IAsset[], [params?: any]>;
  createFolder: UseAsyncReturn<any, [data?: any]>;
  upload: UseAsyncReturn<any, [Arrayable<IFileWithData>]>;
  del: UseAsyncReturn<any, [ids: any[]]>;
  update: UseAsyncReturn<
    any,
    [id: number, data: { alt?: string; copyright?: string; tags?: any[] }]
  >;
  rename: UseAsyncReturn<any, [id: string | number, name: string]>;

  params: any;
  setParams: (v: any) => void;

  selectedAssets: IAsset[];
  selection: ExtendedSelection<IAsset>;
  uploads: IUploads;

  assets: IAsset[];
  assetsState: ModelState<IAsset>;

  stateData: any;
  setStateData: (key: string, val: any) => void;

  openFolderDialog: () => void;
  openFileDialog: () => void;

  openItem: (data?: any) => void;

  view: ViewTypes;
  setView: (type: ViewTypes) => void;

  assetSrc: (asset: IAsset) => string;
}

const AssetsContext = createContext<IAssetsContext>({} as any);

const AssetsContextProvider = ({ children }) => {
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [uploads, setUploads] = useState<IUploads>({});

  const [params, setParams] = useState<any>({});

  const [view, setView] = useStorageState<ViewTypes>(
    'assetDefaultView',
    'tiles'
  );

  const assetSrc = (asset: IAsset) => `/api/assets/single?${querystring.stringify({
    npath: asset?.thumbnail || asset.npath
  })}`;

  const assetsState = useModelState<IAsset>([], (a, b) => {
    if (a?.mimeType === FOLDER_MIME_TYPE && b?.mimeType !== FOLDER_MIME_TYPE) {
      return -1;
    }
    if (a?.mimeType !== FOLDER_MIME_TYPE && b?.mimeType === FOLDER_MIME_TYPE) {
      return 1;
    }

    if (!a?.name || !b?.name) return 0;
    return a.name.localeCompare(b.name);
  });

  const folderInput = useRef<HTMLInputElement>();
  const fileInput = useRef<HTMLInputElement>();

  const selection = useSelection({
    onSelectionChanged: () => {
      setSelectedAssets(selection.getSelection());
    },
    getKey: (asset: IAsset) => asset.id,
  });

  const [stateData, setStateDataImpl] = useState({});
  const setStateData = (key: string, value: any) => {
    setStateDataImpl({
      ...(stateData || {}),
      [key]: value,
    });
  };

  const getAssets = useAsyncCallback(async (data) => {
    try {
      assetsState.setArrayState([]);
      const request = await axios.get('/api/assets', {
        params: data,
      });
      assetsState.setArrayState(request.data);
      return request.data;
    } catch (e) {
      throw e.response.message;
    }
  });

  const getAncestors = useAsyncCallback(async (data) => {
    try {
      const request = await axios.get('/api/assets/ancestors', {
        params: data,
      });
      return request.data;
    } catch (e) {
      throw e.response.message;
    }
  });

  const upload = useAsyncCallback(
    async (filesWithData: Arrayable<IFileWithData>) => {
      if (!Array.isArray(filesWithData)) {
        filesWithData = [filesWithData];
      }

      const promises = filesWithData.map<Promise<void>>((fileWithData) =>
        (async () => {
          const { file, data } = fileWithData;
          const id = uuid();
          const formData = new FormData();
          const name = data?.name || (file as any)?.path || (file as any)?.webkitRelativePath || file?.name || id;

          data.name = name;
          data.duplicateName = true;

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

          Object.keys(data ?? {}).forEach((key) => {
            if (data[key]) {
              formData.append(key, data[key]);
            }
          });

          formData.append('file', file);

          await axios.post('/api/assets', formData, { onUploadProgress });
          setUploads(({[id]: _, ...state}) => state);
        })()
      );

      await Promise.all(promises);

      // Now lets diff the state
      const request = await axios.get('/api/assets', { params });
      assetsState.setArrayState(request.data);
    }
  );

  const createFolder = useAsyncCallback(async (data = {}) => {
    try {
      const request = await axios.post('/api/assets', {
        ...data,
        mimeType: FOLDER_MIME_TYPE,
      });
      assetsState.create([request.data]);
      return request.data;
    } catch (e) {
      throw e.response?.data;
    }
  });

  const del = useAsyncCallback(async (ids) => {
    try {
      const request = await axios.delete('/api/assets', {
        data: ids,
      });
      assetsState.delete(ids);
      return request.data;
    } catch (e) {
      throw e.response?.data;
    }
  });

  const rename = useAsyncCallback(async (id, name) => {
    try {
      const request = await axios.put(`/api/assets/${id}/rename`, {
        name,
      });
      assetsState.update([request.data]);
      return request.data;
    } catch (e) {
      throw e.response?.data;
    }
  });

  const update = useAsyncCallback(async (id, { alt, copyright, tags }) => {
    try {
      const request = await axios.put(`/api/assets/${id}`, {
        alt,
        copyright,
        tags,
      });
      assetsState.update([request.data]);
      return request.data;
    } catch (e) {
      throw e.response?.data;
    }
  });

  const openFileDialog = useCallback(() => {
    fileInput.current?.click?.();
  }, []);

  const openFolderDialog = useCallback(() => {
    folderInput.current?.click?.();
  }, []);

  const handleAssetInput = useCallback(
    async (event) => {
      const files = event?.target?.files as FileList;

      await Promise.all(
        Object.values(files).map(async (file: File) => {
          return upload.execute({
            file,
            data: {
              mimeType: file.type,
              parentId: params?.parentId,
            },
          });
        })
      );

      if (Object.keys(files)?.length > 1) {
        getAssets.execute(params);
      }
    },
    [getAssets]
  );

  const openItem = useCallback(
    ({ id, mimeType } = {}) => {
      if (mimeType === FOLDER_MIME_TYPE || !mimeType) {
        setParams({
          ...params,
          parentId: id,
        });
        getAssets.execute({
          ...params,
          parentId: id,
        });
        getAncestors.execute({
          id,
        });
      } else {
        selection.setAllSelected(false);
        selection.setKeySelected(id, true, false);
      }
    },
    [getAssets, params]
  );

  useEffect(() => {
    if (Array.isArray(getAssets?.result)) {
      selection.setItems(getAssets?.result);
    }
  }, [getAssets.result]);

  return (
    <AssetsContext.Provider
      value={{
        getAssets,
        selectedAssets,
        upload,
        uploads,
        del,
        createFolder,
        getAncestors,
        rename,
        update,

        params,
        setParams,

        assetsState,
        assets: assetsState.arrayState,

        stateData,
        setStateData,

        assetSrc,

        openFileDialog,
        openFolderDialog,

        selection,
        view,
        setView,
        openItem,
      }}
    >
      <input
        multiple
        // @ts-ignore
        directory=""
        webkitdirectory=""
        hidden
        type="file"
        ref={folderInput}
        onChange={handleAssetInput}
        onClick={(event) => {
          (event.target as any).value = null;
        }}
      />
      <input
        multiple
        hidden
        type="file"
        ref={fileInput}
        onChange={handleAssetInput}
        onClick={(event) => {
          (event.target as any).value = null;
        }}
      />
      {children}
    </AssetsContext.Provider>
  );
};

const useAssets = () => useContext(AssetsContext);

export { useAssets, AssetsContextProvider, FOLDER_MIME_TYPE, IMAGE_MIME_TYPES };
