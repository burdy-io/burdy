import { useAsyncCallback, UseAsyncReturn } from 'react-async-hook';
import React, { createContext, useContext, useMemo, useState } from 'react';
import axios from 'axios';
import { Selection } from '@fluentui/react';
import { IPost } from '@shared/interfaces/model';
import { ModelState, useModelState } from '@admin/helpers/hooks';

interface IPostsContext {
  selection: Selection<IPost>;
  getPosts: UseAsyncReturn<IPost[], [params?: any]>;
  getPost: UseAsyncReturn<IPost, [id: number, params?: any]>;
  getBySlug: UseAsyncReturn<IPost, [slug: string]>;
  createPost: UseAsyncReturn<IPost, [data?: any]>;
  updatePost: UseAsyncReturn<IPost, [id: number, data?: any]>;
  publishPosts: UseAsyncReturn<any, [data?: any]>;
  copyPosts: UseAsyncReturn<IPost, [id: number, data?: any]>;
  updatePostContent: UseAsyncReturn<IPost, [id: number, data?: any]>;
  compilePost: UseAsyncReturn<IPost, [post: any]>;
  getIFrameData: UseAsyncReturn<any, [id: number]>;
  deletePosts: UseAsyncReturn<any[], [ids?: number[]]>;

  getVersions: UseAsyncReturn<IPost[], [postId: number, params?: any]>;
  getVersionsCount: UseAsyncReturn<any, [postId: number]>;
  deleteVersions: UseAsyncReturn<any[], [postId: number, ids?: number[]]>;
  restoreVersion: UseAsyncReturn<IPost[], [postId: number, id: number]>;

  post: IPost;
  setPost: (post: IPost) => void;

  posts: IPost[];
  postsState: ModelState<IPost>;

  params: any;
  setParams: (params: any) => void;

  getOneContentType: UseAsyncReturn<IPost, [id: number]>;

  selectedPosts: IPost[];

  stateData: any;
  setStateData: (key: string, val: any) => void;
}

const PostsContext = createContext<IPostsContext>({} as any);

const PostsContextProvider = ({ children }) => {
  const [selectedPosts, setSelectedPosts] = useState([]);

  const [stateData, setStateDataImpl] = useState({});
  const setStateData = (key: string, value: any) => {
    setStateDataImpl({
      ...(stateData || {}),
      [key]: value,
    });
  };

  const [params, setParams] = useState({});

  const [post, setPost] = useState<IPost>(null);
  const postsState = useModelState<IPost>([], (a, b) => {
    if (!a?.updatedAt || !b?.updatedAt) return 0;
    return (new Date(b.updatedAt)).getTime() - (new Date(a.updatedAt)).getTime();
  });

  const selection = useMemo(
    () =>
      new Selection<IPost>({
        onSelectionChanged: () => {
          setSelectedPosts(selection.getSelection());
        },
        getKey: (post) => post.id,
      }),
    []
  );

  const getPosts = useAsyncCallback(async (params) => {
    try {
      postsState.setArrayState([]);
      const response = await axios.get('/api/posts', {
        params,
      });
      postsState.setArrayState(response.data);
      return response.data;
    } catch (e) {
      throw e.response.data;
    }
  });

  const getPost = useAsyncCallback(async (id, params) => {
    try {
      const response = await axios.get(`/api/posts/${id}`, {
        params,
      });
      setPost(response.data);
      return response.data;
    } catch (e) {
      throw e.response.data;
    }
  });

  const getBySlug = useAsyncCallback(async (slugPath) => {
    try {
      const response = await axios.get(`/api/posts/one`, {
        params: {
          slugPath,
        },
      });
      setPost(response.data);
      return response.data;
    } catch (e) {
      throw e.response.data;
    }
  });

  const getOneContentType = useAsyncCallback(async (id) => {
    try {
      const response = await axios.get(`/api/content-types/${id}`);
      return response.data;
    } catch (e) {
      throw e.response.data;
    }
  });

  const createPost = useAsyncCallback(async (data) => {
    try {
      const response = await axios.post('/api/posts', data);
      postsState.create([response.data]);
      return response.data;
    } catch (e) {
      throw e.response.data;
    }
  });

  const updatePost = useAsyncCallback(async (id, data) => {
    try {
      const response = await axios.put(`/api/posts/${id}`, data);
      postsState.update([response.data]);
      setPost(response.data);
      return response.data;
    } catch (e) {
      throw e.response.data;
    }
  });

  const publishPosts = useAsyncCallback(async (data) => {
    try {
      const response = await axios.put(`/api/posts/publish`, data);
      // @ts-ignore
      setPost({
        ...(post || {}),
        status: response.data?.[0]?.status,
        publishedAt: response.data?.[0]?.publishedAt,
        publishedFrom: response.data?.[0]?.publishedFrom,
        publishedUntil: response.data?.[0]?.publishedUntil,
      });
      return response.data;
    } catch (e) {
      throw e.response.data;
    }
  });

  const copyPosts = useAsyncCallback(async (id, data) => {
    try {
      const response = await axios.post(`/api/posts/${id}/copy`, data);
      postsState.create(response.data);
      return response.data;
    } catch (e) {
      throw e.response.data;
    }
  });

  const updatePostContent = useAsyncCallback(async (id, data) => {
    try {
      const response = await axios.put(`/api/posts/${id}/content`, data);
      setPost(response.data);
      return response.data;
    } catch (e) {
      throw e.response.data;
    }
  });

  const deletePosts = useAsyncCallback(async (ids) => {
    try {
      await axios.delete('/api/posts', {
        data: ids,
      });
      postsState.delete(ids);
      return ids;
    } catch (e) {
      throw e.response?.data;
    }
  });

  const compilePost = useAsyncCallback(async (data) => {
    try {
      const response = await axios.post('/api/posts/compile', data);
      return response.data;
    } catch (e) {
      throw e.response.data;
    }
  });

  const getIFrameData = useAsyncCallback(async (id) => {
    try {
      const response = await axios.get(`/api/posts/iframe/${id}`);
      return response.data;
    } catch (e) {
      throw e.response.data;
    }
  });

  const getVersions = useAsyncCallback(async (postId, params) => {
    try {
      const response = await axios.get(`/api/posts/${postId}/versions`, {
        params,
      });
      return response.data;
    } catch (e) {
      throw e.response.data;
    }
  });

  const getVersionsCount = useAsyncCallback(async (postId) => {
    try {
      const response = await axios.get(`/api/posts/${postId}/versions`, {
        params: {
          count: true,
        },
      });
      return response.data;
    } catch (e) {
      throw e.response.data;
    }
  });

  const deleteVersions = useAsyncCallback(async (postId, ids) => {
    try {
      const response = await axios.delete(`/api/posts/${postId}/versions`, {
        data: ids,
      });
      return response.data;
    } catch (e) {
      throw e.response.data;
    }
  });

  const restoreVersion = useAsyncCallback(async (postId, id) => {
    try {
      const response = await axios.post(`/api/posts/${postId}/versions/${id}`);
      return response.data;
    } catch (e) {
      throw e.response.data;
    }
  });

  return (
    <PostsContext.Provider
      value={{
        selection,

        selectedPosts,

        getPosts,
        getPost,
        getBySlug,
        createPost,
        updatePost,
        updatePostContent,
        deletePosts,
        copyPosts,
        publishPosts,

        getOneContentType,

        compilePost,
        getIFrameData,

        getVersions,
        getVersionsCount,
        deleteVersions,
        restoreVersion,

        post,
        setPost,

        posts: postsState.arrayState,
        postsState,

        params,
        setParams,

        stateData,
        setStateData,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
};

const usePosts = () => useContext(PostsContext);

export { usePosts, PostsContextProvider };
