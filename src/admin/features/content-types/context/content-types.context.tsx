import { UseAsyncReturn } from 'react-async-hook';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { Selection } from '@fluentui/react';
import { IContentType } from '@shared/interfaces/model';
import { ModelState, useModelState } from '@admin/helpers/hooks';
import apiAxios, { useApiCallback } from '@admin/helpers/api';

interface IContentTypesContext {
  selection: Selection<IContentType>;
  getContentTypes: UseAsyncReturn<IContentType[], [params?: any]>;
  getContentType: UseAsyncReturn<IContentType, [id: number]>;
  createContentType: UseAsyncReturn<IContentType, [data?: any]>;
  updateContentType: UseAsyncReturn<IContentType, [id: number, data?: any]>;
  deleteContentTypes: UseAsyncReturn<
    number[] | string[],
    [ids?: number[] | string[], params?: any]
  >;
  importContentTypes: UseAsyncReturn<IContentType[], [data?: any]>;

  selectedContentTypes: IContentType[];

  getComponents: UseAsyncReturn<any, []>;

  getFields: UseAsyncReturn<any, []>;
  getField: UseAsyncReturn<any, [type: string]>;

  contentTypes: IContentType[];
  contentTypesState: ModelState<IContentType>;

  params: any;
  setParams: (params: any) => void;

  stateData: any;
  setStateData: (key: string, val: any) => void;
}

const ContentTypesContext = createContext<IContentTypesContext>({} as any);

const ContentTypesContextProvider = ({ children }) => {
  const [selectedContentTypes, setSelectedContentTypes] = useState([]);

  const [params, setParams] = useState({});

  const contentTypesState = useModelState<IContentType>([], (a, b) => {
    if (!a?.updatedAt || !b?.updatedAt) return 0;
    return (new Date(b.updatedAt)).getTime() - (new Date(a.updatedAt)).getTime();
  });

  const [stateData, setStateDataImpl] = useState({});
  const setStateData = (key: string, value: any) => {
    setStateDataImpl({
      ...(stateData || {}),
      [key]: value,
    });
  };

  const selection = useMemo(
    () =>
      new Selection<IContentType>({
        onSelectionChanged: () => {
          setSelectedContentTypes(selection.getSelection());
        },
        getKey: (post) => post.id,
      }),
    []
  );

  const getContentTypes = useApiCallback(async (params) => {
    contentTypesState.setArrayState([]);
    const response = await apiAxios.get('/content-types', { params });
    contentTypesState.setArrayState(response?.data);
    return response;
  });

  const getContentType = useApiCallback(async (id) =>
    apiAxios.get(`/content-types/${id}`)
  );

  const createContentType = useApiCallback(async (data) => {
    const response = await apiAxios.post('/content-types', data);
    contentTypesState.create([response?.data]);
    return response;
  });

  const updateContentType = useApiCallback(async (id, data) => {
    const response = await apiAxios.put(`/content-types/${id}`, data);
    contentTypesState.update([response?.data]);
    return response;
  });

  const deleteContentTypes = useApiCallback(async (ids, params) => {
    const response = await apiAxios.delete('/content-types', {
      data: ids,
      params,
    });
    contentTypesState.delete(ids);
    return response;
  });

  const importContentTypes = useApiCallback(async (data) => apiAxios.post(`/content-types/import`, data));

  const getComponents = useApiCallback(async () => apiAxios.get(`/components`));

  const getFields = useApiCallback(async () => apiAxios.get(`/fields`));

  const getField = useApiCallback(async (type) =>
    apiAxios.get(`/fields/${type}`)
  );

  return (
    <ContentTypesContext.Provider
      value={{
        selection,
        selectedContentTypes,

        contentTypes: contentTypesState.arrayState,
        contentTypesState,

        getContentTypes,
        getContentType,
        createContentType,
        updateContentType,
        deleteContentTypes,
        importContentTypes,

        getComponents,

        getFields,
        getField,

        params,
        setParams,

        stateData,
        setStateData,
      }}
    >
      {children}
    </ContentTypesContext.Provider>
  );
};

const useContentTypes = () => useContext(ContentTypesContext);

export { useContentTypes, ContentTypesContextProvider };
