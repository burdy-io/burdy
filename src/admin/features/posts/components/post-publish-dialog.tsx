import { ControlledCheckbox, ControlledDatePicker } from '@admin/components/rhf-components';
import { useSnackbar } from '@admin/context/snackbar';
import { usePosts } from '@admin/features/posts/context/posts.context';
import {
  Checkbox,
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Stack
} from '@fluentui/react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { IPost } from '@shared/interfaces/model';

interface IPostPublishDialogProps {
  posts: IPost[];
  isOpen?: boolean;
  title?: string;
  onDismiss?: () => void;
  onUpdated?: (data?: any) => void;
  disableRecursive?: boolean;
}

const PostPublishDialog: React.FC<IPostPublishDialogProps> = ({
                                                                isOpen,
                                                                onDismiss,
                                                                onUpdated,
                                                                title,
                                                                posts,
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

  const [scheduleEnabled, setScheduleEnabled] = useState(false);

  useEffect(() => {
    publishPosts.reset();
    if (isOpen) {
      setScheduleEnabled(false);
      reset({
        recursive: false
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (publishPosts?.result && isOpen) {
      onUpdated(publishPosts?.result);
      openSnackbar({
        message: 'Post(s) published',
        messageBarType: MessageBarType.success
      });
    }
  }, [publishPosts?.result]);

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: title || 'Publish post(s)'
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
        {!disableRecursive && <ControlledCheckbox control={control} name='recursive' label='Include children' />}
        <Checkbox
          onChange={(e, val) => {
            setScheduleEnabled(val);
          }}
          checked={scheduleEnabled}
          name='schedule'
          label='Schedule at date'
        />
        {scheduleEnabled && (
          <ControlledDatePicker
            control={control}
            label='Published from'
            name='publishedFrom'
          />
        )}
        {scheduleEnabled && (
          <ControlledDatePicker
            control={control}
            label='Published until'
            name='publishedUntil'
          />
        )}
      </Stack>
      <DialogFooter>
        <DefaultButton onClick={onDismiss} data-cy="dialog-cancel" text='Cancel' />
        <PrimaryButton
          onClick={() => {
            handleSubmit((data) => {
              publishPosts.execute({
                ...(data || {}),
                publish: true,
                ids: posts.map(post => post.id)
              });
            })();
          }}
          text='Publish'
          disabled={publishPosts?.loading}
          data-cy="dialog-confirm"
        />
      </DialogFooter>
    </Dialog>
  );
};

export default PostPublishDialog;
