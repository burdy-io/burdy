import React, { useEffect, useState } from 'react';
import { composeWrappers } from '@admin/helpers/hoc';
import { useHistory, useLocation, useParams } from 'react-router';
import { useSnackbar } from '@admin/context/snackbar';
import { MessageBarType } from '@fluentui/react';
import queryString from 'query-string';
import {
  PostsContextProvider,
  usePosts
} from '../../posts/context/posts.context';
import EditorCommandBar from '../components/editor-command-bar';
import PostPublishDialog from '../../posts/components/post-publish-dialog';
import PostUnpublishDialog from '../../posts/components/post-unpublish-dialog';
import PostSettingsDialog from '../../posts/components/post-settings-dialog';
import ContentTypeUpdatePanel from '../../content-types/components/content-type-update-panel';
import PostVersionsSelectPanel from '../../posts/components/post-versions-select-panel';
import PostVersionsDeleteDialog from '../../posts/components/post-versions-delete-dialog';
import PostVersionsRestoreDialog from '../../posts/components/post-versions-restore-dialog';
import { useForm } from 'react-hook-form';
import PreviewEditor from '@admin/features/editor/components/preview-editor';
import HeadlessEditor from '@admin/features/editor/components/headless-editor';
import _ from 'lodash';
import { testPaths } from '@admin/helpers/utility';
import { useAllowedPaths } from '@admin/helpers/hooks';

const EditorPage = () => {
  const params = useParams<any>();
  const history = useHistory();
  const location = useLocation();
  const search = queryString.parse(location?.search);
  const allowedPaths = useAllowedPaths();

  const {
    getPost,
    getVersionsCount,
    updatePostContent,
    stateData,
    setStateData,
    post,
    setPost
  } = usePosts();

  const [device, setDevice] = useState('desktop');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [enableEditor, setEnableEditor] = useState<boolean>();
  const { openSnackbar } = useSnackbar();

  const [editorType, setEditorType] = useState(null);
  const [menuOpened, setMenuOpened] = useState(true);

  const methods = useForm({
    mode: 'all',
    shouldUnregister: true
  });

  useEffect(() => {
    let id;
    if (search?.action) {
      setMessage(search?.action);
      id = setTimeout(() => {
        setMessage(null);
        const search = queryString.parse(window?.location?.search);
        history.push({
          search: queryString.stringify({
            ...(search || {}),
            action: undefined
          })
        });
      }, 5000);
    } else {
      setMessage(null);
    }
    return () => {
      if (id) {
        clearTimeout(id);
      }
    };
  }, [search?.action]);

  useEffect(() => {
    if (post) {
      methods.reset((post?.meta as any)?.content);
      setLoading(false);
      if (
        post?.type === 'page' ||
        post?.type === 'post' ||
        post?.type === 'hierarchical_post'
      ) {
        setEnableEditor(!!testPaths(allowedPaths, post?.slugPath));
      }
    }
  }, [post?.id, post?.slugPath, post?.versionId]);

  useEffect(() => {
    setPost(null);
    setLoading(true);
    getPost.execute(params?.postId, {
      versionId: search.versionId
    });
  }, [params?.postId, search.versionId]);

  useEffect(() => {
    if (post?.id) {
      const values = _.cloneDeep(methods?.getValues());
      setLoading(true);
      setEditorType(null);
      setTimeout(() => {
        methods.reset(values);
        if (search?.editor === 'preview' && testPaths(allowedPaths, post?.slugPath)) {
          setEditorType('preview');
        } else {
          setEditorType('headless');
        }
        setLoading(false);
      }, 200);
    }
  }, [search?.editor, post?.id]);

  useEffect(() => {
    if (updatePostContent?.result) {
      openSnackbar({
        message: 'Post updated successfully',
        messageBarType: MessageBarType.success
      });
    }
  }, [updatePostContent?.result]);

  const handleSubmit = () => {
    methods.handleSubmit(
      (data) => {
        updatePostContent.execute(post?.id, data);
      },
      () => {
        openSnackbar({
          message: 'Form has errors',
          messageBarType: MessageBarType.severeWarning
        });
      }
    )();
  };

  return (
    <div className='page-wrapper'>
      <EditorCommandBar
        loading={loading}
        handleSubmit={handleSubmit}
        device={device}
        onDeviceChange={(device) => {
          setDevice(device);
        }}
        enableEditor={enableEditor}
        menuOpened={menuOpened}
        toggleMenu={setMenuOpened}
        editor={editorType}
      />
      <div className='page-content'>
        {enableEditor && editorType === 'preview' && (
          <PreviewEditor
            methods={methods}
            device={device}
            menuOpened={menuOpened}
            message={message}
            loading={loading}
          />
        )}
        {editorType === 'headless' && (
          <HeadlessEditor methods={methods} message={message} loading={loading} />
        )}
      </div>
      <PostSettingsDialog
        onDismiss={() => setStateData('updatePostOpen', false)}
        onUpdated={() => {
          setStateData('updatePostOpen', false);
        }}
        isOpen={stateData?.updatePostOpen}
        post={post}
      />
      <PostPublishDialog
        onDismiss={() => setStateData('publishPostOpen', false)}
        onUpdated={() => {
          setStateData('publishPostOpen', false);
        }}
        isOpen={stateData?.publishPostOpen}
        posts={[post]}
      />
      <PostUnpublishDialog
        onDismiss={() => setStateData('unpublishPostOpen', false)}
        onUpdated={() => {
          setStateData('unpublishPostOpen', false);
        }}
        isOpen={stateData?.unpublishPostOpen}
        posts={[post]}
      />
      <ContentTypeUpdatePanel
        isOpen={stateData?.updateContentTypeOpen}
        contentTypeId={post?.contentTypeId}
        onDismiss={() => {
          setStateData('updateContentTypeOpen', false);
        }}
        onUpdated={(data) => {
          setPost({
            ...post,
            contentType: data
          });
          setStateData('updateContentTypeOpen', false);
        }}
      />
      <PostVersionsSelectPanel
        isOpen={stateData?.versionsOpen}
        post={post}
        onDismiss={() => setStateData('versionsOpen', false)}
        onSelect={(post) => {
          history.push({
            search: queryString.stringify({
              ...(queryString.parse(location.search) || {}),
              versionId: post?.id
            })
          });
          setStateData('versionsOpen', false);
        }}
        onUpdate={() => {
          getVersionsCount.execute(post?.id);
          setLoading(true);
          setPost(null);
          getPost.execute(params?.postId);
          setStateData('versionsOpen', false);
        }}
        onDelete={() => {
          getVersionsCount.execute(post?.id);
        }}
      />
      <PostVersionsDeleteDialog
        isOpen={stateData?.versionsDeleteOpen}
        post={post}
        onDismiss={() => setStateData('versionsDeleteOpen', false)}
        onDeleted={() => {
          setStateData('versionsDeleteOpen', false);
          history.push({
            search: queryString.stringify({
              ...(queryString.parse(location.search) || {}),
              versionId: undefined,
              action: 'version_deleted'
            })
          });
        }}
      />
      <PostVersionsRestoreDialog
        isOpen={stateData?.versionRestoreOpen}
        post={post}
        onDismiss={() => setStateData('versionRestoreOpen', false)}
        onRestored={() => {
          setStateData('versionRestoreOpen', false);
          history.push({
            search: queryString.stringify({
              ...(queryString.parse(location.search) || {}),
              versionId: undefined,
              action: 'version_restored'
            })
          });
          setStateData('versionRestoreOpen', false);
        }}
      />
    </div>
  );
};

export default composeWrappers({
  postsContext: PostsContextProvider
})(EditorPage);
