import React, { useEffect, useRef, useState } from 'react';
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
import IFrameEditor from '@admin/features/editor/components/iframe-editor';

const IFramePage = () => {
  const params = useParams<any>();
  const history = useHistory();
  const location = useLocation();

  const [, setValue] = useState(null);

  const [device, setDevice] = useState('desktop');

  const {
    getPost,
    getVersionsCount,
    updatePostContent,
    stateData,
    setStateData,
    post,
    setPost
  } = usePosts();

  const formRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const { openSnackbar } = useSnackbar();

  const [menuOpened, setMenuOpened] = useState(true);

  useEffect(() => {
    if (post) {
      setLoading(false);
    }
  }, [post]);

  useEffect(() => {
    getPost.execute(params?.postId, queryString.parse(location.search) as any);
  }, [params?.postId, location?.search]);

  const handleSubmit = () => {
    const form = formRef.current?.getForm();
    form.handleSubmit(
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
        displayDevice
        device={device}
        onDeviceChange={(device) => {
          setDevice(device);
        }}
        loading={loading}
        handleSubmit={handleSubmit}
        displayToggleMenu
        menuOpened={menuOpened}
        toggleMenu={setMenuOpened} />
      <div className='page-content'>
        <IFrameEditor
          ref={formRef}
          device={device}
          menuOpened={menuOpened}
          onChange={(val) => {
            setValue(val);
          }}
        />
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
            search: queryString.stringify({ versionId: post?.id })
          });
          window.location.reload();
          setStateData('versionsOpen', false);
        }}
        onUpdate={() => {
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
            search: 'action=version_deleted'
          });
          window.location.reload();
        }}
      />
      <PostVersionsRestoreDialog
        isOpen={stateData?.versionRestoreOpen}
        post={post}
        onDismiss={() => setStateData('versionRestoreOpen', false)}
        onRestored={() => {
          setStateData('versionRestoreOpen', false);
          history.push({
            search: 'action=version_restored'
          });
          window.location.reload();
        }}
      />
    </div>
  );
};

export default composeWrappers({
  postsContext: PostsContextProvider
})(IFramePage);
