import {
  CommandBar,
  ICommandBarItemProps,
  NeutralColors, PrimaryButton,
  SearchBox,
} from '@fluentui/react';
import React, {useMemo} from 'react';
import {useHistory} from 'react-router';
import {useDebouncedCallback} from 'use-debounce';
import {useAuth} from '@admin/features/authentication/context/auth.context';
import {usePosts} from '../context/posts.context';

const enableIframeEditor = process.env.PUBLIC_ENABLE_IFRAME_EDITOR === 'true';

const PostsCommandBar = () => {
  const history = useHistory();
  const {filterPermissions} = useAuth();

  const {
    selectedPosts,
    getPosts,
    params,
    setParams,
    stateData,
    setStateData,
    additionalData,
  } = usePosts();

  const debounced = useDebouncedCallback(async (val) => {
    setParams({
      ...(params || {}),
      search: val,
    });
    getPosts.execute({
      ...params,
      search: val,
    });
  }, 500);

  const commandItems = useMemo<ICommandBarItemProps[]>(
    () => {
      const commandBarItems: ICommandBarItemProps[] = [];

      if (additionalData?.parentId) {
        commandBarItems.push({
          key: 'back',
          text: 'Back',
          iconProps: {iconName: 'Back'},
          onClick: () => {
            history.push(`/sites?id=${additionalData?.parentId}`)
          }
        });
      }

      commandBarItems.push(...filterPermissions([
        {
          key: 'newItem',
          text: 'New',
          'data-cy': 'post-commandBar-new',
          iconProps: {iconName: 'Add'},
          permissions: ['posts_create'],
          onClick: () => {
            setStateData('createPostOpen', true);
          },
        },
        {
          key: 'edit',
          text: 'Edit',
          'data-cy': 'post-commandBar-edit',
          disabled: selectedPosts?.length !== 1,
          iconProps: {iconName: 'Edit'},
          permissions: ['posts_update'],
          onClick: () => {
            if (additionalData?.parentId) {
              history.push(`/sites/editor/${selectedPosts?.[0]?.id}`);
            } else {
              history.push(
                `/posts/${selectedPosts?.[0]?.contentTypeId}/editor/${selectedPosts?.[0]?.id}`
              );
            }
          },
        },
        {
          key: 'settings',
          text: 'Settings',
          'data-cy': 'post-commandBar-settings',
          disabled:
            selectedPosts?.length !== 1 || selectedPosts?.[0]?.type === 'site',
          iconProps: {iconName: 'Settings'},
          permissions: ['posts_update'],
          onClick: () => {
            setStateData('updatePostOpen', true);
          },
        },
        {
          key: 'copyItem',
          text: 'Duplicate',
          'data-cy': 'post-commandBar-duplicate',
          disabled:
            selectedPosts?.length !== 1,
          iconProps: {iconName: 'Copy'},
          permissions: ['posts_create'],
          onClick: () => {
            setStateData('copyPostsOpen', true);
          },
        },
        {
          key: 'delete',
          text: 'Delete',
          'data-cy': 'post-commandBar-delete',
          disabled: selectedPosts?.length === 0,
          iconProps: {iconName: 'Delete'},
          permissions: ['posts_delete'],
          onClick: () => {
            setStateData('deletePostsOpen', true);
          },
        },
        {
          key: 'publish',
          text: 'Publish',
          'data-cy': 'post-commandBar-publish',
          disabled: selectedPosts?.length === 0,
          iconProps: {iconName: 'WebPublish'},
          permissions: ['posts_update'],
          onClick: () => {
            setStateData('publishPostOpen', true);
          },
        },
        {
          key: 'unpublish',
          text: 'Unpublish',
          'data-cy': 'post-commandBar-unpublish',
          disabled: selectedPosts?.length === 0,
          iconProps: {iconName: 'UnpublishContent'},
          permissions: ['posts_update'],
          onClick: () => {
            setStateData('unpublishPostOpen', true);
          },
        },
        {
          key: 'refresh',
          text: 'Refresh',
          'data-cy': 'post-commandBar-refresh',
          iconProps: {iconName: 'Refresh'},
          onClick: () => {
            getPosts.execute(params);
          },
        },
      ]))

      if (enableIframeEditor) {
        const index = commandBarItems.findIndex(item => item.key === 'edit');
        if (index > -1) {
          commandBarItems.splice(index, 0, {
            key: 'editFrame',
            text: 'Customize',
            iconProps: { iconName: 'Edit' },
            permissions: ['posts_update'],
            onRender: () => {
              return <div style={{ display: 'flex', alignItems: 'center', margin: '0 4px' }}>
                <PrimaryButton onClick={() => {
                  history.push(`/sites/frame/${selectedPosts?.[0]?.id}`);
                }}>
                  Customize
                </PrimaryButton>
              </div>;
            }
          });
        }
      }

      return commandBarItems;
    },
    [selectedPosts, params, stateData, additionalData]
  );

  const farToolbarItems = useMemo<ICommandBarItemProps[]>(
    () => [
      {
        key: 'search',
        onRenderIcon: () => (
          <SearchBox
            placeholder="Search posts..."
            onChange={(event, newValue) => {
              debounced(newValue);
            }}
          />
        ),
      },
    ],
    []
  );

  return (
    <CommandBar
      items={commandItems}
      style={{borderBottom: `1px solid ${NeutralColors.gray30}`}}
      farItems={farToolbarItems}
    />
  );
};

export default PostsCommandBar;
