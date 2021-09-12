import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Stack,
} from '@fluentui/react';
import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { ControlledTextField } from '@admin/components/rhf-components';
import { useAssets } from '../context/assets.context';

const AssetsRenameDialog = () => {
  const { rename, selectedAssets, stateData, setStateData } = useAssets();

  const selectedAsset = useMemo(() => {
    return selectedAssets[0];
  }, [selectedAssets]);

  const { control, handleSubmit, reset } = useForm({});

  useEffect(() => {
    if (stateData?.renameAssetOpen) {
      reset({
        name: selectedAsset?.name,
      });
      rename.reset();
    }
  }, [stateData?.renameAssetOpen]);

  useEffect(() => {
    if (rename?.result) {
      setStateData('renameAssetOpen', false);
    }
  }, [rename?.result]);

  return (
    <Dialog
      hidden={!stateData?.renameAssetOpen}
      onDismiss={() => setStateData('renameAssetOpen', false)}
      dialogContentProps={{
        type: DialogType.close,
        title: 'Rename?',
      }}
      modalProps={{
        styles: { main: { maxWidth: 450 } },
      }}
    >
      {rename?.error && (
        <MessageBar
          messageBarType={MessageBarType.error}
          isMultiline={false}
          onDismiss={() => rename.reset()}
          dismissButtonAriaLabel="Close"
        >
          Name already exist
        </MessageBar>
      )}
      <Stack tokens={{ childrenGap: 10 }}>
        <ControlledTextField
          name="name"
          data-cy="assets-rename-name"
          control={control}
          rules={{
            required: 'Name is required',
          }}
        />
      </Stack>
      <DialogFooter>
        <PrimaryButton
          onClick={() => {
            handleSubmit((data) => {
              rename.execute(selectedAsset?.id, data?.name);
            })();
          }}
          data-cy="assets-rename-submit"
          text="Rename"
          disabled={rename?.loading}
        />
        <DefaultButton
          onClick={() => setStateData('renameAssetOpen', false)}
          text="Cancel"
        />
      </DialogFooter>
    </Dialog>
  );
};

export default AssetsRenameDialog;
