import {ControlledTextField} from '@admin/components/rhf-components';
import {useSnackbar} from '@admin/context/snackbar';
import {usePosts} from '@admin/features/posts/context/posts.context';
import TagsPickerControl from '@admin/features/tags/components/tags-picker-control';
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
import React, {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {slugRegex, slugRegexMessage} from '@shared/validators';

interface IPostSettingsDialogProps {
  post: any;
  isOpen?: boolean;
  onDismiss?: () => void;
  onUpdated?: (data?: any) => void;
}

const PostSettingsDialog: React.FC<IPostSettingsDialogProps> = ({
                                                                  isOpen,
                                                                  onDismiss,
                                                                  onUpdated,
                                                                  post,
                                                                }) => {
  const {updatePost} = usePosts();
  const {openSnackbar} = useSnackbar();

  const {control, handleSubmit, reset} = useForm({
    mode: 'all',
  });

  useEffect(() => {
    updatePost.reset();
    if (isOpen) {
      reset({
        name: post?.name,
        slug: post?.slug,
        tags: post?.tags,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (updatePost?.result && isOpen) {
      onUpdated(updatePost?.result);
      openSnackbar({
        message: 'Post updated',
        messageBarType: MessageBarType.success,
      });
    }
  }, [updatePost?.result]);

  const submit = handleSubmit((data) => {
    updatePost.execute(post?.id, data);
  })

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: 'Update post',
      }}
      modalProps={{
        styles: {main: {maxWidth: 450}},
      }}
    >
      <form onSubmit={submit}>
        <Stack
          tokens={{
            childrenGap: 8,
          }}
        >
          {updatePost.error?.message && (
            <MessageBar messageBarType={MessageBarType.error}>
              {updatePost.error.message}
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
          <TagsPickerControl label="Tags" name="tags" control={control}/>
        </Stack>
        <DialogFooter>
          <DefaultButton onClick={onDismiss} text="Cancel"/>
          <PrimaryButton
            type="submit"
            text="Update"
            disabled={updatePost?.loading}
          />
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export default PostSettingsDialog;
