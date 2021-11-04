import {
  CommandBar,
  ICommandBarItemProps,
  ICommandBarProps, MessageBarType,
  NeutralColors,
  SearchBox,
} from '@fluentui/react';
import React, { useMemo } from 'react';
import { copyToClipboard } from '@admin/helpers/utility';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import { useDebouncedCallback } from 'use-debounce';
import { FOLDER_MIME_TYPE, useAssets } from '../context/assets.context';
import {useSnackbar} from "@admin/context/snackbar";
import AssetProgressIndicator from "@admin/features/assets/components/asset-progress-indicator";

type ColumnType =
  | 'new'
  | 'upload'
  | 'details'
  | 'rename'
  | 'download'
  | 'delete'
  | 'copy'
  | 'refresh'
  | 'view'
  | 'search';

export interface IAssetCommandBarProps extends Partial<ICommandBarProps> {
  visibleColumns?: ColumnType[];
}

const AssetsCommandBar: React.FC<IAssetCommandBarProps> = ({
  visibleColumns = [
    'new',
    'upload',
    'details',
    'rename',
    'download',
    'delete',
    'copy',
    'refresh',
    'view',
  ],
  ...props
}) => {
  const {
    openFileDialog,
    openFolderDialog,
    view,
    params,
    setParams,
    getAssets,
    setView,
    selectedAssets,
    setStateData,
    stateData,
  } = useAssets();

  const {openSnackbar} = useSnackbar();

  const debounced = useDebouncedCallback(async (val) => {
    setParams({
      ...(params || {}),
      search: val,
      parentId: null,
    });
    getAssets.execute({
      ...(params || {}),
      search: val,
      parentId: null,
    });
  }, 500);

  const { filterPermissions } = useAuth();

  const commandItems = useMemo<ICommandBarItemProps[]>(
    () =>
      filterPermissions([
        {
          key: 'new',
          text: 'New',
          'data-cy': 'assets-commandBar-new',
          iconProps: { iconName: 'Add' },
          permissions: ['assets_create'],
          subMenuProps: {
            items: [
              {
                key: 'folder',
                text: 'Folder',
                'data-cy': 'assets-commandBar-new-folder',
                onClick: () => setStateData('newFolderOpen', true),
              },
            ],
          },
        },
        {
          key: 'upload',
          text: 'Upload',
          'data-cy': 'assets-commandBar-upload',
          iconProps: { iconName: 'Upload' },
          permissions: ['assets_create'],
          subMenuProps: {
            items: [
              {
                key: 'folder',
                text: 'Folder',
                onClick: openFolderDialog,
              },
              {
                key: 'file',
                text: 'Files',
                onClick: openFileDialog,
              },
            ],
          },
        },
        {
          key: 'details',
          text: 'Details',
          'data-cy': 'assets-commandBar-details',
          disabled:
            selectedAssets?.length !== 1 &&
            selectedAssets[0]?.mimeType !== FOLDER_MIME_TYPE,
          iconProps: { iconName: 'Info' },
          onClick: () => setStateData('assetDetailsOpen', true),
        },
        {
          key: 'rename',
          text: 'Rename',
          'data-cy': 'assets-commandBar-rename',
          permissions: ['assets_update'],
          disabled: selectedAssets?.length !== 1,
          iconProps: { iconName: 'Edit' },
          onClick: () => setStateData('renameAssetOpen', true),
        },
        {
          key: 'download',
          text: 'Download',
          'data-cy': 'assets-commandBar-download',
          disabled:
            selectedAssets?.length !== 1 ||
            (selectedAssets[0] &&
              selectedAssets[0].mimeType === FOLDER_MIME_TYPE),
          iconProps: { iconName: 'Download' },
          onClick: () =>
            window
              .open(
                `/api/assets/${selectedAssets[0].id}?attachment=true`,
                '_blank'
              )
              .focus(),
        },
        {
          key: 'delete',
          text: 'Delete',
          'data-cy': 'assets-commandBar-delete',
          disabled: selectedAssets?.length === 0,
          iconProps: { iconName: 'Delete' },
          permissions: ['assets_delete'],
          onClick: () => setStateData('deleteAssetsOpen', true),
        },
        {
          key: 'copy',
          text: 'Copy URL',
          'data-cy': 'assets-commandBar-copy',
          disabled:
            selectedAssets?.length !== 1 ||
            (selectedAssets[0] &&
              selectedAssets[0].mimeType === FOLDER_MIME_TYPE),
          iconProps: { iconName: 'Copy' },
          onClick: () => {
            copyToClipboard(
              `${window.location.origin}/api/uploads/${selectedAssets[0]?.npath}`
            );
            openSnackbar({
              message: 'Successfully copied URL to clipboard!',
              messageBarType: MessageBarType.success,
              duration: 1000,
            });
          },
        },
        {
          key: 'refresh',
          text: 'Refresh',
          'data-cy': 'assets-commandBar-refresh',
          iconProps: { iconName: 'Refresh' },
          onClick: () => {
            getAssets.execute(params);
          },
        },
      ]).filter(({ key }) => visibleColumns.includes(key as ColumnType)),
    [selectedAssets, getAssets, params, stateData, visibleColumns]
  );

  const commandFarItems = useMemo(
    () =>
      [
        {
          key: 'view',
          iconOnly: true,
          'data-cy': 'assets-commandBar-view',
          iconProps: { iconName: view === 'tiles' ? 'Tiles' : 'List' },
          subMenuProps: {
            items: [
              {
                key: 'tiles',
                text: 'Tiles',
                'data-cy': 'assets-commandBar-view-tiles',
                iconProps: { iconName: 'Tiles' },
                onClick: () => setView('tiles'),
              },
              {
                key: 'list',
                text: 'List',
                'data-cy': 'assets-commandBar-view-list',
                iconProps: { iconName: 'List' },
                onClick: () => setView('list'),
              },
            ],
          },
        },
        {
          key: 'search',
          'data-cy': 'assets-commandBar-search',
          onRenderIcon: () => (
            <SearchBox
              placeholder="Search assets..."
              onChange={(event, newValue) => {
                debounced(newValue);
              }}
            />
          ),
        },
      ].filter(({ key }) => visibleColumns.includes(key as ColumnType)),
    [view, visibleColumns, debounced]
  );

  return (
    <>
      <CommandBar
        items={commandItems}
        farItems={commandFarItems}
        style={{ borderBottom: `1px solid ${NeutralColors.gray30}` }}
        data-cy="assets-commandBar"
        {...props}
      />
      <AssetProgressIndicator />
    </>
  );
};

export default AssetsCommandBar;
