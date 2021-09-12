import { ControlledCheckbox } from '@admin/components/rhf-components';
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
import { useContentTypes } from '../context/content-types.context';

interface IContentTypesDeleteDialogProps {
  isOpen?: boolean;
  onDismiss?: () => void;
  onDeleted?: (ids?: string[] | number[]) => void;
}

const ContentTypesDeleteDialog: React.FC<IContentTypesDeleteDialogProps> = ({
  isOpen,
  onDismiss,
  onDeleted,
}) => {
  const { deleteContentTypes, selectedContentTypes } = useContentTypes();

  const { control, handleSubmit, reset } = useForm({
    mode: 'all',
  });

  useEffect(() => {
    deleteContentTypes.reset();
    reset();
  }, [isOpen]);

  useEffect(() => {
    if (deleteContentTypes?.result) {
      onDeleted(deleteContentTypes?.result);
    }
  }, [deleteContentTypes?.result]);

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: 'Delete?',
      }}
      modalProps={{
        styles: { main: { maxWidth: 450 } },
      }}
    >
      <Stack tokens={{ childrenGap: 8 }}>
        Are you sure you would like to delete these item(s)?
        {deleteContentTypes.error?.message && (
          <MessageBar messageBarType={MessageBarType.error}>
            {deleteContentTypes.error.message}
          </MessageBar>
        )}
        {deleteContentTypes.error?.message === 'posts_exist' && (
          <ControlledCheckbox
            label="Force delete (will delete all posts)"
            name="force"
            defaultValue={false}
            control={control}
            data-cy="dialog-force"
          />
        )}
      </Stack>
      <DialogFooter>
        <DefaultButton onClick={onDismiss} text="Cancel" data-cy="dialog-cancel" />
        <PrimaryButton
          onClick={() => {
            handleSubmit((data) => {
              deleteContentTypes.execute(
                selectedContentTypes.map((contentType) => contentType.id),
                data
              );
            })();
          }}
          text="Delete"
          disabled={deleteContentTypes?.loading}
          data-cy="dialog-confirm"
        />
      </DialogFooter>
    </Dialog>
  );
};

export default ContentTypesDeleteDialog;
