import Heading from '@admin/components/heading';
import { composeWrappers } from '@admin/helpers/hoc';
import React, { useEffect, useState } from 'react';
import ColumnsView from '@admin/components/columns';
import {
  getTheme,
  mergeStyleSets,
  Shimmer,
  ShimmerElementType,
} from '@fluentui/react';
import queryString from 'query-string';
import { useHistory, useLocation } from 'react-router';
import { PostsContextProvider, usePosts } from '../context/posts.context';
import CreatePageDialog from '../components/page-create-dialog';
import CreateFolderDialog from '../components/folder-create-dialog';
import CreateFragmentDialog from '../components/fragment-create-dialog';
import PostDetails from '../components/post-details';
import SitesCommandBar from '../components/sites-command-bar';
import SitesList from '../components/sites-list';
import SitesDeleteDialog from '../components/sites-delete-dialog';
import PostSettingsDialog from '../components/post-settings-dialog';
import SitesCopyDialog from '../components/sites-copy-dialog';
import PostPublishDialog from '@admin/features/posts/components/post-publish-dialog';
import PostUnpublishDialog from '@admin/features/posts/components/post-unpublish-dialog';
import CreatePostContainerDialog from "@admin/features/posts/components/hierarchical-post-create-dialog";

const theme = getTheme();

const styles = mergeStyleSets({
  mainWrapper: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'flex-start',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  content: {
    flexGrow: 1,
    height: '100%',
    overflowY: 'auto',
    position: 'relative',
    padding: '0 24px',
  },
  side: {
    maxWidth: 270,
    minWidth: 270,
    flexGrow: 1,
    height: '100%',
    overflowY: 'auto',
    boxShadow: theme.effects.elevation16,
  },
  cardHeading: {
    padding: '0 14px',
    boxShadow: theme.effects.elevation4,
    display: 'flex',
    position: 'relative',
    height: 44,
    alignItems: 'center',
  },
});

const SitesPage = () => {
  const {
    getPosts,

    posts,

    params,
    selection,

    selectedPosts,

    stateData,
    setStateData,
  } = usePosts();

  const [selectedPost, setSelectedPost] = useState();

  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    getPosts.execute({
      type: 'page,folder,fragment,hierarchical_post',
    });
    const search = queryString.parse(location.search) as any;
    setSelectedPost(search?.id);
  }, []);

  useEffect(() => {
    if (selectedPosts?.length > 1) {
      history.push({
        search: queryString.stringify({ id: selectedPosts?.[0]?.parentId }),
      });
    } else if (selectedPosts?.length === 1) {
      history.push({
        search: queryString.stringify({ id: selectedPosts?.[0]?.id }),
      });
    }
  }, [selectedPosts]);

  return (
    <div className="page-wrapper">
      <SitesCommandBar />
      <div
        className="page-content page-content-scroll"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100% - 45px)',
        }}
      >
        <div className={styles.mainWrapper}>
          <div className={styles.content}>
            <Heading
              title={
                selectedPosts?.length === 1
                  ? `Sites: ${selectedPosts?.[0]?.slugPath}`
                  : 'Sites'
              }
            />
            <div style={{ flex: 1, height: 'calc(100% - 60px)' }}>
              {!params?.search?.length && (
                <ColumnsView
                  loading={getPosts?.loading}
                  defaultSelected={[parseInt(selectedPost, 10)]}
                  selection={selection}
                  sort={(a, b) => {
                    if (!a?.updatedAt || !b?.updatedAt) return 0;
                    return (new Date(b.updatedAt)).getTime() - (new Date(a.updatedAt)).getTime();
                  }}
                  items={(posts || []).map((item) => {
                    let iconName: string;
                    switch (item.type) {
                      case 'folder':
                        iconName = 'FolderHorizontal';
                        break;
                      case 'fragment':
                        iconName = 'WebAppBuilderFragment';
                        break;
                      case 'hierarchical_post':
                        iconName = 'ArrangeBringToFront';
                        break;
                      default:
                        iconName = 'Page';
                        break;
                    }
                    return {
                      ...item,
                      actionType: 'sites',
                      title: item?.name,
                      helper: item?.slug,
                      key: item.id,
                      opacity: item?.status === 'published' ? 1 : 0.45,
                      iconProps: {
                        iconName,
                      },
                    };
                  })}
                />
              )}
              {params?.search?.length > 0 && <SitesList />}
            </div>
          </div>

          <div className={styles.side}>
            <div className={styles.cardHeading}>
              {getPosts.loading ? (
                <Shimmer
                  width={50}
                  shimmerElements={[
                    { type: ShimmerElementType.line, height: 8 },
                  ]}
                  style={{}}
                />
              ) : (
                selectedPosts?.length === 1 && 'Details'
              )}
            </div>
            <div style={{ padding: 24 }}>
              {selectedPosts?.length === 1 && (
                <PostDetails
                  loading={getPosts.loading}
                  post={selectedPosts[0]}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <CreatePageDialog
        isOpen={stateData?.createPageOpen}
        defaultValues={{
          parentId:
            selectedPosts?.length === 1 ? selectedPosts?.[0]?.id : undefined,
          contentType:
            selectedPosts?.length === 1
              ? selectedPosts?.[0]?.contentTypeId
              : undefined,
        }}
        onCreated={() => {
          setStateData('createPageOpen', false);
        }}
        onDismiss={() => setStateData('createPageOpen', false)}
      />
      <CreateFragmentDialog
        isOpen={stateData?.createFragmentOpen}
        defaultValues={{
          parentId:
            selectedPosts?.length === 1 ? selectedPosts?.[0]?.id : undefined,
          contentType:
            selectedPosts?.length === 1
              ? selectedPosts?.[0]?.contentTypeId
              : undefined,
        }}
        onCreated={() => {
          setStateData('createFragmentOpen', false);
        }}
        onDismiss={() => setStateData('createFragmentOpen', false)}
      />
      <CreateFolderDialog
        isOpen={stateData?.createFolderOpen}
        defaultValues={{
          parentId:
            selectedPosts?.length === 1 ? selectedPosts?.[0]?.id : undefined,
        }}
        onCreated={() => {
          setStateData('createFolderOpen', false);
        }}
        onDismiss={() => setStateData('createFolderOpen', false)}
      />
      <CreatePostContainerDialog
        isOpen={stateData?.createPostContainerOpen}
        defaultValues={{
          parentId:
            selectedPosts?.length === 1 ? selectedPosts?.[0]?.id : undefined,
        }}
        onCreated={() => {
          setStateData('createPostContainerOpen', false);
        }}
        onDismiss={() => {
          setStateData('createPostContainerOpen', false);
        }}
      />
      <SitesDeleteDialog
        isOpen={stateData?.deletePostsOpen}
        onDeleted={() => {
          setStateData('deletePostsOpen', false);
        }}
        onDismiss={() => setStateData('deletePostsOpen', false)}
      />
      <PostSettingsDialog
        onDismiss={() => setStateData('updatePostOpen', false)}
        onUpdated={() => {
          setStateData('updatePostOpen', false);
          getPosts.execute({
            type: 'page,folder,fragment,hierarchical_post',
            ...(params || {}),
          });
        }}
        isOpen={stateData?.updatePostOpen}
        post={selectedPosts?.[0]}
      />
      <SitesCopyDialog
        onDismiss={() => setStateData('copyPostsOpen', false)}
        onCreated={() => {
          setStateData('copyPostsOpen', false);
          getPosts.execute({
            type: 'page,folder,fragment,hierarchical_post',
            ...(params || {}),
          });
        }}
        isOpen={stateData?.copyPostsOpen}
        post={selectedPosts?.[0]}
      />
      <PostPublishDialog
        onDismiss={() => setStateData('publishPostOpen', false)}
        onUpdated={() => {
          setStateData('publishPostOpen', false);
          getPosts.execute({
            type: 'page,folder,fragment,hierarchical_post',
            ...(params || {}),
          });
        }}
        isOpen={stateData?.publishPostOpen}
        posts={selectedPosts}
      />
      <PostUnpublishDialog
        onDismiss={() => setStateData('unpublishPostOpen', false)}
        onUpdated={() => {
          setStateData('unpublishPostOpen', false);
          getPosts.execute({
            type: 'page,folder,fragment,hierarchical_post',
            ...(params || {}),
          });
        }}
        isOpen={stateData?.unpublishPostOpen}
        posts={selectedPosts}
      />
    </div>
  );
};

export default composeWrappers({
  postsContext: PostsContextProvider,
})(SitesPage);
