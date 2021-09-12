import React, { createContext, useContext, useMemo, useState } from 'react';
import { useAsyncCallback, UseAsyncReturn } from 'react-async-hook';
import axios from 'axios';
import { Selection } from '@fluentui/react';
import { ITag } from '@shared/interfaces/model';
import { withWrapper } from '@admin/helpers/hoc';
import { ModelState, useModelState } from '@admin/helpers/hooks';
import apiAxios, {useApiCallback} from "@admin/helpers/api";

interface ITagsContext {
  selection: Selection<ITag>;

  getTags: UseAsyncReturn<ITag[], [params?: any]>;
  deleteTags: UseAsyncReturn<number[], [ids: any[]]>;
  createTag: UseAsyncReturn<ITag, [data?: any]>;
  updateTag: UseAsyncReturn<ITag, [id: number, data?: any]>;

  params: any;
  setParams: (params: any) => void;

  selectedTags: ITag[];

  tags: ITag[];
  tagsState: ModelState<ITag>;

  stateData: any;
  setStateData: (key: string, val: any) => void;
}

const TagsContext = createContext<ITagsContext>({} as any);

const TagsContextProvider = ({ children }) => {
  const [selectedTags, setSelectedTags] = useState([]);

  const tagsState = useModelState<ITag>([], (a, b) => {
    if (!a?.updatedAt || !b?.updatedAt) return 0;
    return (new Date(b.updatedAt)).getTime() - (new Date(a.updatedAt)).getTime();
  });

  const [params, setParams] = useState({});

  const [stateData, setStateDataImpl] = useState({});
  const setStateData = (key: string, value: any) => {
    setStateDataImpl({
      ...(stateData || {}),
      [key]: value,
    });
  };

  const selection = useMemo(
    () =>
      new Selection<ITag>({
        onSelectionChanged: () => {
          setSelectedTags(selection.getSelection());
        },
        getKey: (tag) => tag.id,
      }),
    []
  );

  const getTags = useApiCallback<ITag[], [params?: any]>(async (params) => {
    const response = await apiAxios.get('/tags', {
      params,
    });

    tagsState.setArrayState(response.data);
    return response;
  });

  const createTag = useApiCallback<ITag, [data?: any]>(async (data) => {
    const response = await apiAxios.post('/tags', data);
    tagsState.create([response.data]);
    return response;
  });

  const updateTag = useApiCallback<ITag, [id: number, data?: any]>(
    async (id, data) => {
      const response = await apiAxios.put(`/tags/${id}`, data);
      tagsState.update([response.data]);
      return response;
    }
  );

  const deleteTags = useAsyncCallback<number[], [ids: any[]]>(async (ids) => {
    try {
      await apiAxios.delete('/tags', {data: ids});
      tagsState.delete(ids);
      return ids;
    } catch (e) {
      throw e.response.data;
    }
  });

  return (
    <TagsContext.Provider
      value={{
        selection,

        selectedTags,

        getTags,
        createTag,
        deleteTags,
        updateTag,

        tags: tagsState.arrayState,
        tagsState,

        params,
        setParams,

        stateData,
        setStateData,
      }}
    >
      {children}
    </TagsContext.Provider>
  );
};

const useTags = () => useContext(TagsContext);

const withTagsContext = withWrapper(TagsContextProvider);

export { useTags, TagsContextProvider, withTagsContext };
