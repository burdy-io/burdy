import { ControlledTextField } from '@admin/components/rhf-components';
import { usePosts } from '@admin/features/posts/context/posts.context';
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
import slugify from 'slugify';
import { slugRegex, slugRegexMessage } from '@shared/validators';

interface IPostCreateDialogProps {
  isOpen?: boolean;
  onDismiss?: () => void;
  onCreated?: (data?: any) => void;
}

const PostCreateDialog: React.FC<IPostCreateDialogProps> = ({
  isOpen,
  onDismiss,
  onCreated,
}) => {
  const { createPost, getOneContentType } = usePosts();

  const { control, handleSubmit, reset, setValue, formState, watch } = useForm({
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
    createPost.reset();
    reset();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && createPost?.result) {
      onCreated(createPost?.result);
    }
  }, [createPost?.result]);

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: `Create new ${getOneContentType?.result?.name}`,
      }}
      modalProps={{
        styles: { main: { maxWidth: 450 } },
      }}
    >
      <Stack
        tokens={{
          childrenGap: 8,
        }}
      >
        {createPost.error?.message && (
          <MessageBar messageBarType={MessageBarType.error}>
            {createPost.error.message}
          </MessageBar>
        )}
        <ControlledTextField
          rules={{
            required: 'Name is required',
          }}
          name="name"
          label="Name"
          data-cy="post-create-name"
          control={control}
        />
        <ControlledTextField
          name="slug"
          label="Slug"
          data-cy="post-create-slug"
          control={control}
          rules={{
            required: 'Slug is required',
            pattern: {
              value: slugRegex,
              message: slugRegexMessage,
            }
          }}
        />
      </Stack>
      <DialogFooter>
        <DefaultButton data-cy="post-create-cancel" onClick={onDismiss} text="Cancel" />
        <PrimaryButton
          onClick={() => {
            handleSubmit((data) => {
              createPost.execute({
                ...data,
                contentTypeId: getOneContentType?.result?.id,
              });
            })();
          }}
          text="Create"
          data-cy="post-create-submit"
          disabled={createPost?.loading}
        />
      </DialogFooter>
    </Dialog>
  );
};

export default PostCreateDialog;
