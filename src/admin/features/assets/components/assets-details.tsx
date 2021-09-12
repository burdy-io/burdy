import {
  CommandBar,
  DefaultButton,
  ICommandBarItemProps,
  IStackItemStyles,
  makeStyles,
  MessageBar,
  MessageBarType,
  Panel,
  PanelType,
  PrimaryButton,
  Stack,
  Text,
} from '@fluentui/react';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  copyToClipboard,
  getMeta,
  humanFileSize,
} from '@admin/helpers/utility';
import { ControlledTextField } from '@admin/components/rhf-components';
import { useForm } from 'react-hook-form';
import TagsPickerControl from '@admin/features/tags/components/tags-picker-control';
import {
  FOLDER_MIME_TYPE,
  IMAGE_MIME_TYPES,
  useAssets,
} from '../context/assets.context';

const stackItemStyles: IStackItemStyles = {
  root: {
    padding: '1rem 0',
  },
};

const useStyles = makeStyles({
  wrapper: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    columnGap: '2rem',
  },
  heading: {
    paddingTop: '2rem',
    fontWeight: '600',
  },
  itemHeading: {
    fontWeight: '600',
  },
});

const AssetsDetails = () => {
  const styles = useStyles();
  const { update, selectedAssets, stateData, setStateData } = useAssets();

  const selectedAsset = useMemo(() => {
    return selectedAssets[0];
  }, [selectedAssets]);

  const { control, reset, handleSubmit } = useForm();

  useEffect(() => {
    if (stateData?.assetDetailsOpen) {
      update.reset();
      reset({
        alt: getMeta(selectedAsset, 'alt')?.value,
        copyright: getMeta(selectedAsset, 'copyright')?.value,
        tags: selectedAsset?.tags,
      });
    }
  }, [stateData?.assetDetailsOpen]);

  const isImage = useMemo(() => {
    return IMAGE_MIME_TYPES.indexOf(selectedAsset?.mimeType) > -1;
  }, [selectedAsset]);

  useEffect(() => {
    if (update?.result) {
      setStateData('assetDetailsOpen', false);
    }
  }, [update?.result]);

  const Footer = useCallback(
    () => (
      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <PrimaryButton
          type="submit"
          disabled={update.loading}
          onClick={() => {
            handleSubmit((data) => {
              update.execute(selectedAsset?.id, data);
            })();
          }}
          data-cy="assets-details-submit"
        >
          Save
        </PrimaryButton>
        <DefaultButton onClick={() => setStateData('assetDetailsOpen', false)} data-cy="assets-details-close">
          Close
        </DefaultButton>
      </Stack>
    ),
    [selectedAsset, isImage, stateData]
  );

  const commandItems = useMemo<ICommandBarItemProps[]>(
    () => [
      {
        key: 'download',
        text: 'Download',
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
        key: 'copy',
        text: 'Copy URL',
        disabled:
          selectedAssets?.length !== 1 ||
          (selectedAssets[0] &&
            selectedAssets[0].mimeType === FOLDER_MIME_TYPE),
        iconProps: { iconName: 'Copy' },
        onClick: () => {
          copyToClipboard(
            `${window.location.origin}/api/uploads/${selectedAssets[0]?.npath}`
          );
        },
      },
    ],
    [selectedAssets]
  );

  return (
    <Panel
      isLightDismiss
      isOpen={stateData?.assetDetailsOpen}
      onDismiss={() => setStateData('assetDetailsOpen', false)}
      headerText="View asset"
      closeButtonAriaLabel="Close"
      type={PanelType.medium}
      onRenderFooterContent={Footer}
      isFooterAtBottom
    >
      <Stack
        tokens={{
          childrenGap: 10,
        }}
      >
        <Text className={styles.heading} variant="mediumPlus" block>
          {selectedAsset?.name}
        </Text>
        <CommandBar
          items={commandItems}
          styles={{
            root: {
              padding: 0,
            },
          }}
        />
        {update?.error && (
          <MessageBar
            messageBarType={MessageBarType.error}
            isMultiline={false}
            onDismiss={() => update.reset()}
            dismissButtonAriaLabel="Close"
          >
            Name already exist
          </MessageBar>
        )}
        <div className={styles.wrapper}>
          {selectedAsset?.mimeType !== FOLDER_MIME_TYPE && (
            <Stack styles={stackItemStyles}>
              <Text className={styles.itemHeading} variant="medium" block>
                File Size
              </Text>
              <Text variant="medium" block>
                {humanFileSize(selectedAsset?.contentLength)}
              </Text>
            </Stack>
          )}
          <Stack styles={stackItemStyles}>
            <Text className={styles.itemHeading} variant="medium" block>
              Mime Type
            </Text>
            <Text variant="medium" block data-cy="assets-details-mimeType">
              {selectedAsset?.mimeType}
            </Text>
          </Stack>
          <Stack styles={stackItemStyles}>
            <Text className={styles.itemHeading} variant="medium" block>
              Date Created
            </Text>
            <Text variant="medium" block>
              {selectedAsset?.createdAt}
            </Text>
          </Stack>
        </div>

        <Stack tokens={{ childrenGap: 10, maxWidth: 330 }}>
          <TagsPickerControl name="tags" label="Tags" control={control} />
          {isImage && (
            <ControlledTextField name="alt" label="Alt" control={control} />
          )}
          {isImage && (
            <ControlledTextField
              name="copyright"
              label="Copyright"
              control={control}
            />
          )}
        </Stack>
      </Stack>
    </Panel>
  );
};

export default AssetsDetails;
