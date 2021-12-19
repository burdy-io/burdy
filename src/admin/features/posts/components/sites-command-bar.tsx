import {
  CommandBar,
  ICommandBarItemProps,
  MessageBarType,
  NeutralColors,
  SearchBox,
} from '@fluentui/react';
import React, { useMemo } from 'react';
import { useHistory } from 'react-router';
import { useDebouncedCallback } from 'use-debounce';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import { usePosts } from '../context/posts.context';
import { useSnackbar } from '@admin/context/snackbar';
import {
  copyToClipboard,
  testPaths,
} from '@admin/helpers/utility';
import { useAllowedPaths } from '@admin/helpers/hooks';

interface ISitesCommandBarProps {}

const SitesCommandBar: React.FC<ISitesCommandBarProps> = () => {
  const {
    selectedPosts,
    getPosts,
    params,
    setParams,
    stateData,
    setStateData,
  } = usePosts();
  const history = useHistory();

  const { filterPermissions } = useAuth();
  const allowedPaths = useAllowedPaths();
  const snackbar = useSnackbar();

  const debounced = useDebouncedCallback(async (val) => {
    setParams({
      search: val,
    });
    getPosts.execute({
      type: 'page,folder,fragment,hierarchical_post',
      search: val,
    });
  }, 500);

  const commandItems = useMemo<ICommandBarItemProps[]>(() => {
    const items = filterPermissions([
      selectedPosts?.[0]?.type !== 'hierarchical_post'
        ? {
            key: 'newItem',
            text: 'New',
            iconProps: { iconName: 'Add' },
            permissions: ['sites_create'],
            disabled: selectedPosts?.[0]?.type === 'hierarchical_post',
            subMenuProps: {
              items: [
                {
                  key: 'page',
                  text: 'Page',
                  onClick: () => setStateData('createPageOpen', true),
                },
                {
                  key: 'fragment',
                  text: 'Fragment',
                  onClick: () => setStateData('createFragmentOpen', true),
                },
                {
                  key: 'folder',
                  text: 'Folder',
                  onClick: () => setStateData('createFolderOpen', true),
                },
                {
                  key: 'hierarchical_post',
                  text: 'Hierarchical Posts',
                  onClick: () => setStateData('createPostContainerOpen', true),
                },
              ],
            },
          }
        : {
            key: 'open',
            text: 'Open',
            iconProps: { iconName: 'OpenInNewWindow' },
            onClick: () => {
              history.push(`/sites/post-container/${selectedPosts?.[0]?.id}`);
            },
          },
      ['page', 'hierarchical_post'].includes(selectedPosts?.[0]?.type) &&
      testPaths(allowedPaths, selectedPosts?.[0]?.slugPath)
        ? {
            key: 'edit',
            text: 'Edit',
            disabled:
              selectedPosts?.length !== 1 ||
              selectedPosts?.[0]?.type === 'folder',
            iconProps: { iconName: 'Edit' },
            split: true,
            permissions: ['sites_update'],
            subMenuProps: {
              items: [
                {
                  key: 'preview',
                  text: 'Preview',
                  onClick: () => {
                    history.push(
                      `/sites/editor/${selectedPosts?.[0]?.id}?editor=preview`
                    );
                  },
                },
              ],
            },
            onClick: () => {
              history.push(`/sites/editor/${selectedPosts?.[0]?.id}`);
            },
          }
        : {
            key: 'edit',
            text: 'Edit',
            disabled:
              selectedPosts?.length !== 1 ||
              selectedPosts?.[0]?.type === 'folder',
            iconProps: { iconName: 'Edit' },
            permissions: ['sites_update'],
            onClick: () => {
              history.push(`/sites/editor/${selectedPosts?.[0]?.id}`);
            },
          },
      {
        key: 'settings',
        text: 'Settings',
        disabled: selectedPosts?.length !== 1,
        iconProps: { iconName: 'Settings' },
        permissions: ['sites_update'],
        onClick: () => {
          setStateData('updatePostOpen', true);
        },
      },
      {
        key: 'copyItem',
        text: 'Copy',
        disabled: selectedPosts?.length !== 1,
        iconProps: { iconName: 'Copy' },
        permissions: ['sites_create'],
        onClick: () => {
          setStateData('copyPostsOpen', true);
        },
      },
      {
        key: 'delete',
        text: 'Delete',
        disabled: selectedPosts?.length === 0,
        iconProps: { iconName: 'Delete' },
        permissions: ['sites_delete'],
        onClick: () => {
          setStateData('deletePostsOpen', true);
        },
      },
      {
        key: 'quickPublish',
        text: 'Publish',
        disabled: selectedPosts?.length === 0,
        iconProps: { iconName: 'WebPublish' },
        permissions: ['sites_update'],
        onClick: () => {
          setStateData('publishPostOpen', true);
        },
      },
      {
        key: 'quickUnpublish',
        text: 'Unpublish',
        disabled: selectedPosts?.length === 0,
        iconProps: { iconName: 'UnpublishContent' },
        permissions: ['sites_update'],
        onClick: () => {
          setStateData('unpublishPostOpen', true);
        },
      },
      {
        key: 'copyUrl',
        text: 'Copy API URL',
        iconProps: { iconName: 'ClipboardList' },
        disabled:
          selectedPosts?.length === 0 || selectedPosts?.[0]?.type === 'folder',
        onClick: () => {
          const [selectedPost] = selectedPosts;
          copyToClipboard(
            `${window.location.origin}/api/content/${selectedPost.slugPath}`
          );
          snackbar.openSnackbar({
            message: 'Successfully copied URL to clipboard!',
            messageBarType: MessageBarType.success,
            duration: 1000,
          });
        },
      },
      {
        key: 'refresh',
        text: 'Refresh',
        iconProps: { iconName: 'Refresh' },
        onClick: () => {
          getPosts.execute({
            type: 'page,folder,fragment,hierarchical_post',
            ...(params || {}),
          });
        },
      },
    ]);

    return items;
  }, [selectedPosts, params, stateData]);

  const farToolbarItems = useMemo<ICommandBarItemProps[]>(
    () => [
      {
        key: 'search',
        onRenderIcon: () => (
          <SearchBox
            placeholder="Search posts..."
            onChange={(_event, newValue) => {
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

export default SitesCommandBar;
