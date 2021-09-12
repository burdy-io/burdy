import {
  CommandBar,
  ICommandBarItemProps,
  NeutralColors,
  SearchBox,
} from '@fluentui/react';
import React, { useMemo } from 'react';
import { useHistory } from 'react-router';
import { useDebouncedCallback } from 'use-debounce';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import { usePosts } from '../context/posts.context';

const PostsCommandBar = () => {
  const history = useHistory();
  const { filterPermissions } = useAuth();

  const {
    selectedPosts,
    getPosts,
    params,
    setParams,
    stateData,
    setStateData,
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
    () =>
      filterPermissions([
        {
          key: 'newItem',
          text: 'New',
          'data-cy': 'post-commandBar-new',
          iconProps: { iconName: 'Add' },
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
          iconProps: { iconName: 'Edit' },
          permissions: ['posts_update'],
          onClick: () => {
            history.push(
              `/posts/${selectedPosts?.[0]?.contentTypeId}/editor/${selectedPosts?.[0]?.id}`
            );
          },
        },
        {
          key: 'settings',
          text: 'Settings',
          'data-cy': 'post-commandBar-settings',
          disabled:
            selectedPosts?.length !== 1 || selectedPosts?.[0]?.type === 'site',
          iconProps: { iconName: 'Settings' },
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
          iconProps: { iconName: 'Copy' },
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
          iconProps: { iconName: 'Delete' },
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
          iconProps: { iconName: 'WebPublish' },
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
          iconProps: { iconName: 'UnpublishContent' },
          permissions: ['posts_update'],
          onClick: () => {
            setStateData('unpublishPostOpen', true);
          },
        },
        {
          key: 'refresh',
          text: 'Refresh',
          'data-cy': 'post-commandBar-refresh',
          iconProps: { iconName: 'Refresh' },
          onClick: () => {
            getPosts.execute(params);
          },
        },
      ]),
    [selectedPosts, params, stateData]
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
      style={{ borderBottom: `1px solid ${NeutralColors.gray30}` }}
      farItems={farToolbarItems}
    />
  );
};

export default PostsCommandBar;
