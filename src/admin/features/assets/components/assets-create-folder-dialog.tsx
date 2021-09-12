import { ControlledTextField } from '@admin/components/rhf-components';
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
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAssets } from '../context/assets.context';

const AssetsCreateFolderDialog = () => {
  const { stateData, setStateData, createFolder, params } = useAssets();

  const { control, reset, handleSubmit } = useForm({
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (stateData?.newFolderOpen) {
      reset();
      createFolder.reset();
    }
  }, [stateData?.newFolderOpen]);

  useEffect(() => {
    if (createFolder?.result) {
      setStateData('newFolderOpen', false);
    }
  }, [createFolder?.result]);

  return (
    <Dialog
      hidden={!stateData?.newFolderOpen}
      onDismiss={() => setStateData('newFolderOpen', false)}
      dialogContentProps={{
        type: DialogType.normal,
        title: 'New Folder',
      }}
      modalProps={{
        styles: { main: { maxWidth: 450 } },
      }}
    >
      {createFolder?.error && (
        <MessageBar
          messageBarType={MessageBarType.error}
          isMultiline={false}
          onDismiss={() => createFolder.reset()}
          dismissButtonAriaLabel="Close"
        >
          Name already exist
        </MessageBar>
      )}

      <form>
        <Stack tokens={{ childrenGap: 10 }}>
          <ControlledTextField
            name="name"
            control={control}
            data-cy="assets-createFolder-name"
            rules={{
              required: 'Name is required',
            }}
          />
        </Stack>

        <DialogFooter>
          <DefaultButton
            onClick={() => setStateData('newFolderOpen', false)}
            text="Cancel"
          />
          <PrimaryButton
            data-cy="assets-createFolder-submit"
            onClick={() => {
              handleSubmit((data) => {
                createFolder.execute({
                  ...(data || {}),
                  parentId: params?.parentId,
                });
              })();
            }}
            text="Create"
            disabled={createFolder?.loading}
          />
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export default AssetsCreateFolderDialog;
