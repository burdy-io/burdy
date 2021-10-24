import {
  FolderCover,
  ITilesGridItem,
  ITilesGridItemCellProps,
  ITilesGridSegment,
  renderFolderCoverWithLayout,
  renderTileWithLayout,
  ShimmerTile,
  Tile,
  TilesGridMode,
  TilesList,
} from '@fluentui/react-experiments';
import React, { useCallback, useMemo } from 'react';
import {
  AnimationClassNames,
  DetailsList,
  Icon,
  ISelection,
  makeStyles,
  MarqueeSelection,
  SelectionMode,
  SelectionZone,
} from '@fluentui/react';
import { getFileTypeIconProps } from '@fluentui/react-file-type-icons';
import { IAsset } from '@shared/interfaces/model';
import { humanFileSize } from '@admin/helpers/utility';
import AssetsDropzone from '@admin/features/assets/components/assets-dropzone';
import { FOLDER_MIME_TYPE, IMAGE_MIME_TYPES } from '../context/assets.context';

const useStyles = makeStyles((theme) => ({
  tile: {
    ':global(.ms-Tile-name)': {
      display: 'block !important',
    },
  },
  folderTile: {
    ':global(.ms-FolderCover-metadata)': {
      paddingLeft: 8,
    },
  },
}));

// eslint-disable-next-line react/no-unused-prop-types
type ExtendedTileGridItem =
  | ITilesGridItemCellProps<IAsset & { index: any }> & {
      selection: any;
      compact?: boolean;
    };

const FolderCell: React.FC<ExtendedTileGridItem> = ({
  item,
  selection,
  compact,
  ...props
}) => {
  const styles = useStyles();

  const folderCover = (
    <FolderCover
      folderCoverSize={compact ? 'small' : 'large'}
      folderCoverType={item?.thumbnail ? 'media' : 'default'}
    />
  );

  return (
    <AssetsDropzone asset={item} className={styles.tile}>
      <Tile
        role="gridcell"
        aria-colindex={item.index}
        className={AnimationClassNames.fadeIn400}
        selection={selection as any}
        selectionIndex={item.index}
        isFluentStyling
        invokeSelection
        foreground={
          <span className={styles.folderTile}>
            {renderFolderCoverWithLayout(folderCover, {
              children: item?.thumbnail ? (
                <img
                  style={{ width: '100%', height: '100%' }}
                  src={`${window.location.origin}/api/assets/${item.thumbnail}`}
                  alt="placeholder"
                />
              ) : null,
            })}
          </span>
        }
        itemName={item.name}
        itemActivity={<span />}
        tileSize="large"
        {...props}
      />
    </AssetsDropzone>
  );
};

const DocumentCell: React.FC<ExtendedTileGridItem> = ({
  item,
  selection,
  compact,
  ...props
}) => {
  const styles = useStyles();
  const components = item?.name.split('.');
  const fileType = {
    extension: components[components.length - 1],
  };

  return (
    <div className={styles.tile}>
      <Tile
        role="gridcell"
        className={AnimationClassNames.fadeIn400}
        selection={selection as any}
        selectionIndex={item.index}
        isFluentStyling
        invokeSelection
        foreground={
          <Icon
            {...getFileTypeIconProps({
              ...fileType,
              size: compact ? 64 : 96,
              imageFileType: 'svg',
            })}
          />
        }
        showForegroundFrame
        itemName={item.name}
        itemActivity={
          <>
            <div
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {humanFileSize(item.contentLength)}
              &ensp;&middot;&ensp;
              {item.mimeType}
              &nbsp;
            </div>
          </>
        }
        tileSize="large"
        {...props}
      />
    </div>
  );
};

const ShimmerCell: React.FC<ExtendedTileGridItem> = ({
  finalSize,
  ...props
}) => (
  <ShimmerTile
    role="presentation"
    contentSize={finalSize}
    itemName
    itemActivity
    itemThumbnail
    tileSize="large"
    {...props}
  />
);

const MediaCell: React.FC<ExtendedTileGridItem> = ({
  finalSize,
  item,
  selection,
  ...props
}) => {
  const heightMeta = item.meta.find((meta: any) => meta.key === 'height');
  const widthMeta = item.meta.find((meta: any) => meta.key === 'width');

  const width = widthMeta ? Number(widthMeta?.value) : 0;
  const height = heightMeta ? Number(heightMeta?.value) : 0;

  const tile = (
    <Tile
      role="gridcell"
      aria-colindex={item.index}
      contentSize={finalSize}
      className={AnimationClassNames.fadeIn400}
      selection={selection as any}
      selectionIndex={item.index}
      invokeSelection
      showBackgroundFrame
      itemName={item.name}
      itemActivity={
        <>
          <div
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {width}
            &#x205F;&times;&#x205F;
            {height}
            &ensp;&middot;&ensp;
            {humanFileSize(item.contentLength)}
            &nbsp;
          </div>
        </>
      }
      nameplateOnlyOnHover={false}
      {...props}
    />
  );

  return renderTileWithLayout(tile, {
    background: (
      <img
        style={{
          height: '100%',
          width: '100%',
        }}
        alt="placeholder"
        src={`/api/assets/${item.id}`}
      />
    ),
  });
};

const SvgCell: React.FC<ExtendedTileGridItem> = ({
                                                     finalSize,
                                                     item,
                                                     selection,
                                                     ...props
                                                   }) => {
  const tile = (
    <Tile
      role="gridcell"
      aria-colindex={item.index}
      contentSize={finalSize}
      className={AnimationClassNames.fadeIn400}
      selection={selection as any}
      selectionIndex={item.index}
      invokeSelection
      showBackgroundFrame
      itemName={item.name}
      itemActivity={
        <>
          <div
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {humanFileSize(item.contentLength)}
          </div>
        </>
      }
      nameplateOnlyOnHover={false}
      {...props}
    />
  );

  return renderTileWithLayout(tile, {
    background: (
      <img
        style={{
          height: '100%',
          width: '100%',
        }}
        alt="placeholder"
        src={`/api/assets/${item.id}`}
      />
    ),
  });
};

interface IAssetsTilesProps {
  selectionMode?: SelectionMode;
  selection?: ISelection;
  compact?: boolean;
  loading?: boolean;
  items?: any[];
  onItemInvoked?: (item: any) => void;
}

const AssetsTiles: React.FC<IAssetsTilesProps> = ({
  selectionMode = SelectionMode.multiple,
  selection,
  compact,
  loading,
  items,
  onItemInvoked,
}) => {
  const generateTiles = useCallback((): ITilesGridItem<any>[] => {
    const folder = {
      items: [],
      spacing: 8,
      marginBottom: 40,
      minRowHeight: compact ? 136 : 171,
      mode: TilesGridMode.stack,
      key: 'folders-group',
      isPlaceholder: false,
    };

    const file = {
      items: [],
      spacing: 8,
      marginBottom: 40,
      minRowHeight: compact ? 136 : 171,
      mode: TilesGridMode.stack,
      key: 'files-group',
      isPlaceholder: false,
    };

    (items || []).forEach?.((asset, index) => {
      const desiredSize = {
        height: compact ? 136 : 171,
        width: compact ? 141 : 176,
      };

      if (IMAGE_MIME_TYPES.includes(asset.mimeType)) {
        const heightMeta = asset.meta.find(
          (meta: any) => meta.key === 'height'
        );
        const widthMeta = asset.meta.find((meta: any) => meta.key === 'width');

        if (heightMeta) {
          desiredSize.height = Number(heightMeta?.value);
        }

        if (widthMeta) {
          desiredSize.width = Number(widthMeta?.value);
        }
      }

      const defaultProps = {
        id: asset.id,
        key: asset.id,
        content: {
          ...asset,
          key: asset.id,
          index,
        },
        desiredSize,
        isPlaceholder: false,
      };

      if (asset.mimeType === FOLDER_MIME_TYPE) {
        folder.items.push({
          ...defaultProps,
          onRenderCell: (props) => (
            <FolderCell {...props} selection={selection} compact={compact} />
          ),
        });
      } else {
        file.items.push({
          ...defaultProps,
          onRenderCell: (props) => {
            switch (true) {
              case IMAGE_MIME_TYPES.includes(asset.mimeType):
                return <MediaCell {...props} selection={selection} />
              case asset.mimeType === 'image/svg+xml' || asset.mimeType === 'image/svg':
                return <SvgCell {...props} selection={selection} />
              default:
                return <DocumentCell {...props} selection={selection} compact={compact} />
            }
          }
        });
      }
    });

    const list = [];

    if (folder.items.length > 0) {
      list.push(folder);
    }

    if (file.items.length > 0) {
      list.push(file);
    }

    return list;
  }, [items, compact]);

  const shimmerTiles = useMemo<ITilesGridSegment<any>[]>(
    () => [
      {
        items: [
          {
            key: 'shimmerParent',
            content: {
              key: 'shimmerItem-1',
              name: 'name',
              index: 0,
              aspectRatio: 1,
            },
            desiredSize: {
              width: compact ? 136 : 171,
              height: compact ? 136 : 171,
            },
            onRenderCell: (props) => (
              <ShimmerCell selection={null} {...props} />
            ),
            isPlaceholder: true,
          },
        ],
        spacing: 8,
        marginBottom: 0,
        minRowHeight: compact ? 136 : 171,
        mode: TilesGridMode.stack,
        key: 'group1',
        isPlaceholder: true,
      },
    ],
    [compact]
  );

  return (
    <>
      {loading ? (
        <TilesList items={shimmerTiles} role="grid" />
      ) : (
        <MarqueeSelection selection={selection as any}>
          <SelectionZone
            onItemInvoked={(item: any) => {
              if (onItemInvoked) {
                onItemInvoked(item);
              }
            }}
            selection={selection as any}
            selectionMode={selectionMode}
            enterModalOnTouch
          >
            <TilesList items={generateTiles()} role="grid" />
            <div
              style={{
                display: 'none',
              }}
            >
              <DetailsList
                items={items || []}
                selection={selection as any}
                columns={[
                  {
                    key: 'name',
                    name: 'Name',
                    fieldName: 'name',
                    minWidth: 100,
                  },
                ]}
              />
            </div>
          </SelectionZone>
        </MarqueeSelection>
      )}
    </>
  );
};

export default AssetsTiles;
