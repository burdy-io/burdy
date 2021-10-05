import {
  CommandBar,
  ICommandBarItemProps,
  IconButton,
  NeutralColors,
  Shimmer,
  ShimmerElementType,
  Stack,
} from '@fluentui/react';
import React, { useEffect, useMemo } from 'react';
import { useHistory, useParams } from 'react-router';
import queryString from 'query-string';
import { usePosts } from '../../posts/context/posts.context';
import { useAuth } from '@admin/features/authentication/context/auth.context';

export interface EditorCommandBarProps {
  handleSubmit: any;
  displayDevice?: boolean;
  displayToggleMenu?: boolean;
  toggleMenu?: (val: boolean) => void;
  menuOpened?: boolean;
  device?: string;
  onDeviceChange?: (device: string) => void;
  loading?: boolean;
}

const EditorCommandBar: React.FC<EditorCommandBarProps> = ({
  handleSubmit,
  device,
  onDeviceChange,
  displayDevice,
  displayToggleMenu,
  menuOpened,
  toggleMenu,
  loading,
}) => {
  const { getPost, post, setStateData, stateData, getVersionsCount } =
    usePosts();

  const history = useHistory();
  const params = useParams<any>();

  const { filterPermissions } = useAuth();

  useEffect(() => {
    if (post?.id) {
      getVersionsCount.execute(post?.id);
    }
  }, [post]);

  const commandItems = useMemo<ICommandBarItemProps[]>(() => {
    const items: ICommandBarItemProps[] = [
      {
        key: 'back',
        text: 'Back',
        'data-cy': 'editor-commandBar-back',
        iconProps: { iconName: 'Back' },
        onClick: () => {
          if (params?.contentTypeId) {
            history.push(`/posts/${params?.contentTypeId}`);
          } else {
            history.push({
              pathname: '/sites',
              search: queryString.stringify({ id: post?.id }),
            });
          }
        },
      },
    ];

    if (displayDevice && !loading) {
      items.push({
        key: 'deviceSize',
        onRender: () => {
          return (
            <Stack
              horizontal
              tokens={{ childrenGap: 4 }}
              verticalAlign="center"
              style={{ marginLeft: 18 }}
            >
              <IconButton
                iconProps={{ iconName: 'TVMonitor' }}
                title="Desktop"
                ariaLabel="Desktop"
                checked={!device || device === 'desktop'}
                onClick={() => {
                  onDeviceChange('desktop');
                }}
              />
              <IconButton
                iconProps={{ iconName: 'Tablet' }}
                title="Tablet"
                ariaLabel="Tablet"
                checked={device === 'tablet'}
                onClick={() => {
                  onDeviceChange('tablet');
                }}
              />
              <IconButton
                iconProps={{ iconName: 'CellPhone' }}
                title="Mobile"
                ariaLabel="Mobile"
                checked={device === 'mobile'}
                onClick={() => {
                  onDeviceChange('mobile');
                }}
              />
            </Stack>
          );
        },
      });
    }

    return items;
  }, [getPost?.result, device, loading]);

  const farToolbarItems = useMemo<ICommandBarItemProps[]>(() => {
    if (loading) {
      return [
        {
          key: 'loader',
          onRender: () => {
            return (
              <Stack
                horizontal
                tokens={{ childrenGap: 12 }}
                verticalAlign="center"
                style={{ height: '100%' }}
              >
                <Shimmer
                  width={100}
                  shimmerElements={[
                    { type: ShimmerElementType.line, height: 8 },
                  ]}
                  style={{}}
                />
                <Shimmer
                  width={100}
                  shimmerElements={[
                    { type: ShimmerElementType.line, height: 8 },
                  ]}
                  style={{}}
                />
              </Stack>
            );
          },
        },
      ];
    }

    if (post?.versionId) {
      return [
        {
          key: 'history',
          text: getVersionsCount?.result
            ? `History (${getVersionsCount?.result?.count})`
            : 'History',
          iconProps: { iconName: 'History' },
          'data-cy': 'editor-commandBar-history',
          onClick: () => {
            setStateData('versionsOpen', true);
          },
        },
        {
          key: 'restore',
          text: 'Restore',
          'data-cy': 'editor-commandBar-restore',
          iconProps: { iconName: 'Edit' },
          onClick: () => {
            setStateData('versionRestoreOpen', true);
          },
        },
        {
          key: 'delete',
          text: 'Delete',
          'data-cy': 'editor-commandBar-delete',
          iconProps: { iconName: 'Delete' },
          onClick: () => {
            setStateData('versionsDeleteOpen', true);
          },
        },
        {
          key: 'cancel',
          text: 'Cancel',
          'data-cy': 'editor-commandBar-cancel',
          iconProps: { iconName: 'Cancel' },
          onClick: () => {
            history.push({
              search: 'action=version_canceled',
            });
            window.location.reload();
          },
        },
      ];
    }
    const items = filterPermissions([
      {
        key: 'history',
        text: getVersionsCount?.result
          ? `History (${getVersionsCount?.result?.count})`
          : 'History',
        'data-cy': 'editor-commandBar-history',
        iconProps: { iconName: 'History' },
        onClick: () => {
          setStateData('versionsOpen', true);
        },
      },
      {
        key: 'contentType',
        text: 'Edit Content Type',
        'data-cy': 'editor-commandBar-editContentType',
        iconProps: { iconName: 'Edit' },
        permissions: ['content_types_update'],
        onClick: () => {
          setStateData('updateContentTypeOpen', true);
        },
      },
      {
        key: 'settings',
        text: 'Settings',
        'data-cy': 'editor-commandBar-settings',
        iconProps: { iconName: 'Settings' },
        onClick: () => {
          setStateData('updatePostOpen', true);
        },
      },
      {
        key: 'publish',
        text: 'Publish',
        'data-cy': 'editor-commandBar-publish',
        iconProps: { iconName: 'WebPublish' },
        onClick: () => {
          setStateData('publishPostOpen', true);
        },
      },
      {
        key: 'save',
        'data-cy': 'editor-commandBar-save',
        iconProps: { iconName: 'Save' },
        text: 'Save',
        onClick: () => {
          handleSubmit();
        },
      },
    ]);
    if (post?.publishedAt) {
      items.splice(2, 0, {
        key: 'unpublish',
        text: 'Unpublish',
        'data-cy': 'editor-commandBar-unpublish',
        iconProps: { iconName: 'UnpublishContent' },
        onClick: () => {
          setStateData('unpublishPostOpen', true);
        },
      });
    }
    if (displayToggleMenu) {
      items.push({
        key: 'toggle',
        'data-cy': 'editor-commandBar-toggle-menu',
        iconProps: { iconName: 'SidePanelMirrored' },
        checked: menuOpened,
        onClick: () => {
          toggleMenu(!menuOpened);
        },
      },)
    }
    return items;
  }, [getPost?.result, post, loading, stateData, getVersionsCount?.result, menuOpened]);

  return (
    <CommandBar
      items={commandItems}
      style={{ borderBottom: `1px solid ${NeutralColors.gray30}` }}
      farItems={farToolbarItems}
    />
  );
};

export default EditorCommandBar;
