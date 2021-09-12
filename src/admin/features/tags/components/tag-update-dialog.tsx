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
import { useTags } from '../context/tags.context';
import { slugRegex, slugRegexMessage } from '@shared/validators';

interface ITagUpdateDialogProps {
  isOpen?: boolean;
  onDismiss?: () => void;
  onUpdated?: (data?: any) => void;
}

const TagUpdateDialog: React.FC<ITagUpdateDialogProps> = ({
  isOpen,
  onDismiss,
  onUpdated,
}) => {
  const { updateTag, selectedTags } = useTags();

  const { control, handleSubmit, reset } = useForm({
    mode: 'all',
  });

  useEffect(() => {
    if (isOpen) {
      updateTag.reset();
      reset({
        slug: selectedTags?.[0]?.slug,
        name: selectedTags?.[0]?.name,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (updateTag?.result) {
      onUpdated(updateTag?.result);
    }
  }, [updateTag?.result]);

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: `Update ${selectedTags?.[0]?.name}`,
      }}
      modalProps={{
        styles: { main: { maxWidth: 500 } },
      }}
    >
      <Stack
        tokens={{
          childrenGap: 8,
        }}
      >
        {updateTag.error?.message && (
          <MessageBar messageBarType={MessageBarType.error}>
            {updateTag.error.message}
          </MessageBar>
        )}
        <ControlledTextField
          rules={{
            required: 'Name is required',
          }}
          name="name"
          label="Name"
          control={control}
          data-cy="tags-update-name"
        />
        <ControlledTextField
          name="slug"
          label="Slug"
          control={control}
          rules={{
            required: 'Slug is required',
            pattern: {
              value: slugRegex,
              message: slugRegexMessage,
            }
          }}
          data-cy="tags-update-slug"
        />
      </Stack>
      <DialogFooter>
        <DefaultButton onClick={onDismiss} text="Cancel" />
        <PrimaryButton
          onClick={() => {
            handleSubmit((data) => {
              updateTag.execute(selectedTags?.[0]?.id, data);
            })();
          }}
          text="Update"
          disabled={updateTag?.loading}
          data-cy="tags-update-submit"
        />
      </DialogFooter>
    </Dialog>
  );
};

export default TagUpdateDialog;
