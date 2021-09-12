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
import slugify from 'slugify';
import { slugRegex, slugRegexMessage } from '@shared/validators';

interface ITagCreateDialogProps {
  isOpen?: boolean;
  defaultValues?: any;
  onDismiss?: () => void;
  onCreated?: (data?: any) => void;
}

const TagCreateDialog: React.FC<ITagCreateDialogProps> = ({
  isOpen,
  defaultValues,
  onDismiss,
  onCreated,
}) => {
  const { createTag, selectedTags } = useTags();

  const { control, handleSubmit, reset, formState, watch, setValue } = useForm({
    mode: 'all',
  });

  useEffect(() => {
    if (!formState?.dirtyFields?.slug && watch('name')) {
      const parsed = slugify(watch('name'), {
        replacement: '-',
        remove: undefined,
        lower: true,
      });

      setValue('slug', parsed);
    }
  }, [watch('name')]);

  useEffect(() => {
    createTag.reset();
    reset(defaultValues);
  }, [isOpen]);

  useEffect(() => {
    if (createTag?.result) {
      onCreated(createTag?.result);
    }
  }, [createTag?.result]);

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: !selectedTags?.[0]?.id ? 'Create namespace' : 'Create tag',
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
        {createTag.error?.message && (
          <MessageBar messageBarType={MessageBarType.error}>
            {createTag.error.message}
          </MessageBar>
        )}
        <ControlledTextField
          rules={{
            required: 'Name is required',
          }}
          name="name"
          label="Name"
          control={control}
          data-cy="tags-create-name"
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
          data-cy="tags-create-slug"
        />
      </Stack>
      <DialogFooter>
        <DefaultButton onClick={onDismiss} text="Cancel" />
        <PrimaryButton
          onClick={() => {
            handleSubmit((data) => {
              createTag.execute({
                ...data,
                parentId: selectedTags?.[0]?.id,
              });
            })();
          }}
          text="Create"
          disabled={createTag?.loading}
          data-cy="tags-create-submit"
        />
      </DialogFooter>
    </Dialog>
  );
};

export default TagCreateDialog;
