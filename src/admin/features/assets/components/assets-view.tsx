import React, { useMemo } from 'react';
import {
  DetailsListLayoutMode,
  IColumn,
  Icon,
  IDetailsRowProps,
  IRenderFunction,
  makeStyles,
  SelectionMode,
  ShimmeredDetailsList,
} from '@fluentui/react';
import { humanFileSize } from '@admin/helpers/utility';
import Empty from '@admin/components/empty';
import {
  FileIconType,
  getFileTypeIconProps,
} from '@fluentui/react-file-type-icons';
import { IAsset } from '@shared/interfaces/model';
import AssetsDropzone from '@admin/features/assets/components/assets-dropzone';
import { FOLDER_MIME_TYPE, useAssets } from '../context/assets.context';
import AssetsTiles from './assets-tiles';

const useStyles = makeStyles((theme) => ({
  fileIconHeaderIcon: {
    padding: 0,
    fontSize: '16px',
  },
  fileIconCell: {
    textAlign: 'center',
    selectors: {
      '&:before': {
        content: '.',
        display: 'inline-block',
        verticalAlign: 'middle',
        height: '100%',
        width: '0px',
        visibility: 'hidden',
      },
    },
  },
  link: {
    '&:hover': {
      textDecoration: 'underline !important',
      cursor: 'pointer',
    },
  },
  drop: {
    position: 'absolute',
    border: `2px dashed ${theme.palette.themePrimary}`,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 100,
  },
}));

const AssetsView = () => {
  const styles = useStyles();
  const { view, getAssets, assets, selection, openItem, params } = useAssets();

  const onRenderRow: IRenderFunction<IDetailsRowProps> = (
    props,
    defaultRender
  ) => {
    const asset = props.item as IAsset;

    return (
      <AssetsDropzone asset={asset}>{defaultRender(props)}</AssetsDropzone>
    );
  };

  const columns = useMemo<IColumn[]>(
    () => [
      {
        key: 'column1',
        name: 'File Type',
        className: styles.fileIconCell,
        iconClassName: styles.fileIconHeaderIcon,
        ariaLabel:
          'Column operations for File type, Press to sort on File type',
        iconName: 'Page',
        isIconOnly: true,
        fieldName: 'mimeType',
        minWidth: 16,
        maxWidth: 16,
        onRender: (item) => {
          let fileType = {};
          switch (item?.mimeType) {
            case FOLDER_MIME_TYPE:
              fileType = {
                type: FileIconType.folder,
              };
              break;
            default: {
              const components = item.name.split('.');
              fileType = {
                extension: components[components.length - 1],
              };
            }
          }
          return (
            <Icon
              {...getFileTypeIconProps({
                ...fileType,
                size: 20,
                imageFileType: 'svg',
              })}
            />
          );
        },
      },
      {
        key: 'column2',
        name: 'Name',
        fieldName: 'name',
        minWidth: 210,
        isRowHeader: true,
        isResizable: true,
        data: 'string',
        onRender: (item) => {
          return (
            <div
              onClick={() => {
                openItem(item);
              }}
              className={styles.link}
            >
              {item.name}
            </div>
          );
        },
        isPadded: true,
      },
      {
        key: 'column3',
        name: 'Date Modified',
        fieldName: 'modifiedAt',
        minWidth: 200,
        maxWidth: 200,
        isResizable: true,
        data: 'number',
        onRender: ({ updatedAt }) => {
          return (
            <span>
              {new Date(updatedAt).toLocaleDateString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </span>
          );
        },
        isPadded: true,
      },
      {
        key: 'column4',
        name: 'File Size',
        fieldName: 'fileSize',
        minWidth: 70,
        maxWidth: 90,
        isResizable: true,
        isCollapsible: true,
        data: 'number',
        onRender: ({ mimeType, contentLength }) => {
          return (
            mimeType !== FOLDER_MIME_TYPE && (
              <span>{humanFileSize(contentLength)}</span>
            )
          );
        },
      },
    ],
    []
  );

  return (
    <div>
      {view === 'tiles' ? (
        <AssetsTiles
          selection={selection as any}
          onItemInvoked={(item) => openItem(item)}
          loading={getAssets?.loading}
          items={assets}
        />
      ) : (
        <ShimmeredDetailsList
          items={assets ?? []}
          columns={columns}
          enableShimmer={getAssets?.loading}
          selectionMode={SelectionMode.multiple}
          setKey="multiple"
          layoutMode={DetailsListLayoutMode.justified}
          isHeaderVisible
          onRenderRow={onRenderRow}
          selection={selection as any}
          selectionPreservedOnEmptyClick
          enterModalSelectionOnTouch
          ariaLabelForSelectionColumn="Toggle selection"
          ariaLabelForSelectAllCheckbox="Toggle selection for all items"
          checkButtonAriaLabel="select row"
        />
      )}

      {!getAssets?.loading && (!assets || assets.length === 0) && (
        <Empty
          title={
            params?.search?.length > 0
              ? 'No files match criteria'
              : 'Drag files here'
          }
          image="files"
        />
      )}
    </div>
  );
};

export default AssetsView;
