import { useSnackbar } from '@admin/context/snackbar';
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
  Text
} from '@fluentui/react';
import React, { useEffect } from 'react';
import { IPost } from '@shared/interfaces/model';
import { useForm } from 'react-hook-form';
import { ControlledCheckbox } from '@admin/components/rhf-components';

interface IPostUnpublishDialogProps {
  posts: IPost[];
  isOpen?: boolean;
  title?: string;
  onDismiss?: () => void;
  onUpdated?: (data?: any) => void;
  disableRecursive?: boolean;
}

const PostUnpublishDialog: React.FC<IPostUnpublishDialogProps> = ({
                                                                    isOpen,
                                                                    onDismiss,
                                                                    onUpdated,
                                                                    posts,
                                                                    title,
                                                                    disableRecursive
                                                                  }) => {
  const { publishPosts } = usePosts();
  const { openSnackbar } = useSnackbar();

  const { control, handleSubmit, reset } = useForm({
    mode: 'all',
    defaultValues: {
      recursive: false
    }
  });

  useEffect(() => {
    publishPosts.reset();
    if (isOpen) {
      reset({
        recursive: false
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (publishPosts?.result && isOpen) {
      onUpdated(publishPosts?.result);
      openSnackbar({
        message: 'Post(s) unpublished',
        messageBarType: MessageBarType.warning
      });
    }
  }, [publishPosts?.result]);

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: title || 'Unpublish post(s)'
      }}
      modalProps={{
        styles: { main: { maxWidth: 450 } }
      }}
    >
      <Stack
        tokens={{
          childrenGap: 8
        }}
      >
        {publishPosts.error?.message && (
          <MessageBar messageBarType={MessageBarType.error}>
            {publishPosts.error.message}
          </MessageBar>
        )}
        <Text>Are you sure you would like to un-publish posts?</Text>
        {!disableRecursive && <ControlledCheckbox control={control} name='recursive' label='Include children' />}
      </Stack>
      <DialogFooter>
        <DefaultButton onClick={onDismiss} text='Cancel' />
        <PrimaryButton
          onClick={() => {
            handleSubmit((data) => {
              publishPosts.execute({
                ...(data || {}),
                publish: false,
                ids: posts.map(post => post.id)
              });
            })();
          }}
          text='Unpublish'
          disabled={publishPosts?.loading}
        />
      </DialogFooter>
    </Dialog>
  );
};

export default PostUnpublishDialog;
