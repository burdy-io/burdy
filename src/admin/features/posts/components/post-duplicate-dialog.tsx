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
import { IPost } from '@shared/interfaces/model';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { slugRegex, slugRegexMessage } from '@shared/validators';
import slugify from 'slugify';

interface IPostDuplicateDialogProps {
  isOpen?: boolean;
  post?: IPost;
  onDismiss?: () => void;
  onCreated?: (data?: any) => void;
}

const PostDuplicateDialog: React.FC<IPostDuplicateDialogProps> = ({
  isOpen,
  post,
  onDismiss,
  onCreated,
}) => {
  const { copyPosts } = usePosts();

  const { control, handleSubmit, reset, watch, formState, setValue } = useForm({
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
    copyPosts.reset();
    reset();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && copyPosts?.result) {
      onCreated(copyPosts?.result);
    }
  }, [copyPosts?.result]);

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: `Duplicate ${post?.name}`,
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
        {copyPosts.error?.message && (
          <MessageBar messageBarType={MessageBarType.error}>
            {copyPosts.error.message}
          </MessageBar>
        )}
        <ControlledTextField
          rules={{
            required: 'Name is required',
          }}
          name="name"
          label="Name"
          control={control}
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
        />
      </Stack>
      <DialogFooter>
        <DefaultButton onClick={onDismiss} text="Cancel" />
        <PrimaryButton
          onClick={() => {
            handleSubmit((data) => {
              copyPosts.execute(post?.id,{
                ...data
              });
            })();
          }}
          text="Duplicate"
          disabled={copyPosts?.loading}
        />
      </DialogFooter>
    </Dialog>
  );
};

export default PostDuplicateDialog;
