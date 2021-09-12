import React, { useCallback, useEffect } from 'react';
import {
  DefaultButton,
  ISelection,
  Panel,
  PanelType,
  PrimaryButton,
  SelectionMode,
  Stack,
} from '@fluentui/react';
import Empty from '@admin/components/empty';
import {
  AssetsContextProvider,
  FOLDER_MIME_TYPE,
  useAssets,
} from '@admin/features/assets/context/assets.context';
import { composeWrappers } from '@admin/helpers/hoc';
import AssetsCommandBar from '@admin/features/assets/components/assets-command-bar';
import AssetsCreateFolderDialog from './assets-create-folder-dialog';
import AssetsDropzone from './assets-dropzone';
import AssetsBreadcrumb from './assets-breadcrumb';
import AssetsTiles from './assets-tiles';
import AssetsDeleteDialog from '@admin/features/assets/components/assets-delete-dialog';

interface IAssetsSelectPanelProps {
  isOpen?: boolean;
  mimeTypes?: string[];
  selectionMode?: SelectionMode;
  error?: string;
  onDismiss?: () => void;
  onSubmit?: (e: any) => void;
}

const AssetsSelectPanel: React.FC<IAssetsSelectPanelProps> = ({
  isOpen,
  onDismiss,
  onSubmit,
  selectionMode,
  mimeTypes,
}) => {
  const {
    getAssets,
    assets,
    getAncestors,
    setParams,
    selection,
    params,
    selectedAssets,
    openItem,
  } = useAssets();

  useEffect(() => {
    if (isOpen) {
      const mimeType = (mimeTypes || []).join(',');
      setParams({
        mimeType,
      });
      getAssets.execute({
        mimeType,
      });
      getAncestors.execute();
    }
  }, [isOpen]);

  const Footer = useCallback(
    () => (
      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <PrimaryButton
          disabled={
            !(selectedAssets?.length > 0) ||
            (selectedAssets || []).some(
              (asset) => asset?.mimeType === FOLDER_MIME_TYPE
            )
          }
          onClick={() => {
            onSubmit(selectedAssets);
          }}
        >
          Select
        </PrimaryButton>
        <DefaultButton onClick={onDismiss}>Cancel</DefaultButton>
      </Stack>
    ),
    [isOpen, selectedAssets]
  );

  return (
    <Panel
      isOpen={isOpen}
      headerText="Select assets"
      isFooterAtBottom
      onRenderFooterContent={Footer}
      onDismiss={onDismiss}
      type={PanelType.custom}
      customWidth={712 as any}
    >
      <AssetsDropzone>
        <AssetsBreadcrumb />
        <AssetsCommandBar
          visibleColumns={['new', 'upload', 'delete', 'refresh', 'search']}
          style={{}}
          styles={{
            root: {
              padding: 0,
              marginBottom: 24,
            },
          }}
        />
        <AssetsTiles
          loading={getAssets?.loading}
          selection={selection as ISelection}
          selectionMode={selectionMode}
          items={assets}
          onItemInvoked={(item) => {
            openItem(item);
          }}
          compact
        />
        {!getAssets?.loading && (!assets || assets?.length === 0) && (
          <Empty
            title={
              params?.search?.length > 0
                ? 'No files match criteria'
                : 'No files'
            }
            image="files"
          />
        )}
      </AssetsDropzone>
      <AssetsCreateFolderDialog />
      <AssetsDeleteDialog />
    </Panel>
  );
};

export default composeWrappers({
  assetsContext: AssetsContextProvider,
})(AssetsSelectPanel);
