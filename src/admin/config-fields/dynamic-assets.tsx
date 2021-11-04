import React, { useEffect, useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import {
  CommandBar,
  ISelection,
  Label,
  mergeStyleSets,
  SelectionMode,
} from '@fluentui/react';
import { composeWrappers } from '@admin/helpers/hoc';
import Empty from '@admin/components/empty';
import {
  AssetsContextProvider,
  useAssets,
} from '@admin/features/assets/context/assets.context';
import AssetsTiles from '@admin/features/assets/components/assets-tiles';
import AssetsSelect from '@admin/features/assets/components/assets-select-panel';
import { useExtendedFormContext } from '@admin/config-fields/dynamic-form';

const classnames = mergeStyleSets({
  assetsWrapper: {
    minHeight: 240,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
});

interface AssetTilesProps {
  assets: any[];
}

const AssetTiles: React.FC<AssetTilesProps> = ({ assets }) => {
  const { selection, getAssets } = useAssets();

  const [assetsVal, setAssetsVal] = useState([]);

  useEffect(() => {
    const result = [...(getAssets?.result || [])];
    result.sort((a, b) => {
      const aIndex = assets.findIndex((asset) => asset.npath == a.npath);
      const bIndex = assets.findIndex((asset) => asset.npath == b.npath);
      return aIndex - bIndex;
    });
    setAssetsVal(result);
  }, [getAssets?.result]);

  useEffect(() => {
    if (assets?.length > 0) {
      getAssets.execute({
        npath: assets.map((asset) => asset?.npath).join(','),
      });
    } else {
      getAssets.reset();
    }
  }, [assets]);

  return (
    <div className={classnames.assetsWrapper}>
      <AssetsTiles
        loading={getAssets?.loading}
        items={assetsVal}
        compact
        selection={selection as ISelection}
        onItemInvoked={(item) => {
          selection.setAllSelected(false);
          selection.setKeySelected(item?.id, true, false);
        }}
      />

      {!getAssets?.loading && !(getAssets?.result?.length > 0) && (
        <Empty compact title="No assets" image="files" />
      )}
    </div>
  );
};

interface DynamicAssetsProps {
  field: any;
  name?: string;
  mimeTypes?: string[];
  selectionMode?: SelectionMode;
}

const DynamicAssets: React.FC<DynamicAssetsProps> = ({
  field,
  name,
  mimeTypes,
  selectionMode = SelectionMode.single,
}) => {
  const { control, disabled } = useExtendedFormContext();
  const { selectedAssets, getAssets, selection } = useAssets();

  const [addAssetOpen, setAddAssetOpen] = useState(false);

  return (
    <>
      <Controller
        name={name}
        defaultValue={[]}
        control={control}
        render={({ field: { onChange, value: fieldValue } }) => {
          const value = useMemo(() => {
            let val = [];
            try {
              val = JSON.parse(fieldValue);
            } catch {
              //
            }
            return val;
          }, [fieldValue]);
          const selectedItem = useMemo(() => {
            if (selectedAssets?.length === 1) {
              return selectedAssets?.[0];
            }
            return undefined;
          }, [selectedAssets, value]);

          const selectedItemIndex = useMemo(() => {
            return (value || []).findIndex(
              (item) => item?.npath == selectedItem?.npath
            );
          }, [value, selectedItem]);

          const move = (offset) => {
            const items = [
              ...(value || []).filter((_val, i) => i !== selectedItemIndex),
            ];

            items.splice(selectedItemIndex + offset, 0, {
              npath: selectedItem?.npath,
            });

            onChange(JSON.stringify(items));
            selection.setAllSelected(false);
          };

          const commandItems = [
            {
              key: 'addAsset',
              text: 'Add',
              disabled:
                disabled ||
                (selectionMode === SelectionMode.single &&
                getAssets?.result?.length > 0),
              iconProps: { iconName: 'Add' },
              onClick: () => {
                setAddAssetOpen(true);
              },
            },
            {
              key: 'remove',
              text: 'Remove',
              disabled: disabled || selectedAssets?.length === 0,
              iconProps: { iconName: 'Delete' },
              onClick: () => {
                onChange(
                  JSON.stringify((value ?? []).filter((asset) =>
                    selectedAssets.every(
                      (selected) => selected?.npath != asset?.npath
                    )
                  ))
                );
              },
            },
            {
              key: 'moveUp',
              disabled: disabled || selectedAssets?.length !== 1 || selectedItemIndex === 0,
              iconProps: { iconName: 'Up' },
              onClick: () => {
                move(-1);
              },
            },
            {
              key: 'moveDown',
              disabled:
                disabled ||
                selectedAssets?.length !== 1 ||
                selectedItemIndex >= (value || []).length - 1,
              iconProps: { iconName: 'Down' },
              onClick: () => {
                move(1);
              },
            },
          ];

          return (
            <div>
              {field?.label?.length > 0 && (
                <Label>{field?.label}</Label>
              )}
              <CommandBar
                styles={{
                  root: {
                    padding: 0,
                    marginBottom: 8,
                  },
                }}
                items={commandItems}
              />
              <AssetTiles assets={value} />
              <AssetsSelect
                isOpen={addAssetOpen}
                onDismiss={() => {
                  setAddAssetOpen(false);
                }}
                mimeTypes={mimeTypes}
                selectionMode={selectionMode}
                onSubmit={(assets) => {
                  onChange(JSON.stringify([
                    ...(value || []).filter(
                      (val) => !assets.some((asset) => asset?.npath == val?.npath)
                    ),
                    ...(assets || []).map((asset) => ({
                      npath: asset?.npath,
                    })),
                  ]));
                  setAddAssetOpen(false);
                }}
              />
            </div>
          );
        }}
      />
    </>
  );
};

export default composeWrappers({
  assetsContext: AssetsContextProvider,
})(DynamicAssets);
