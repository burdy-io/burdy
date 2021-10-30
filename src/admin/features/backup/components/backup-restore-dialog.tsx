import { ControlledCheckbox } from '@admin/components/rhf-components';
import { useSnackbar } from '@admin/context/snackbar';
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
import { useBackups } from '@admin/features/backup/context/backup.context';

interface IBackupRestoreDialogProps {
  id: string | number;
  isOpen?: boolean;
  onDismiss?: () => void;
  onRestore?: (data?: any) => void;
}

const BackupRestoreDialog: React.FC<IBackupRestoreDialogProps> = ({
  id,
  isOpen,
  onDismiss,
  onRestore,
}) => {
  const { openSnackbar } = useSnackbar();
  const { restore } = useBackups();

  const { control, handleSubmit, reset } = useForm({
    mode: 'all',
    defaultValues: {
      force: false,
    },
  });

  useEffect(() => {
    restore.reset();
    if (isOpen) {
      reset({
        force: false,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (restore?.result && isOpen) {
      onRestore(restore?.result);
      openSnackbar({
        message: 'Backup restored',
        messageBarType: MessageBarType.success,
      });
    }
  }, [restore?.result]);

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: 'Restore backup?',
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
        <p>Are you sure you would like to proceed?</p>
        {restore.error?.message && (
          <MessageBar messageBarType={MessageBarType.error}>
            {restore.error.message}
          </MessageBar>
        )}
        <ControlledCheckbox
          control={control}
          name="force"
          label="Force (will overwrite item if exists)"
        />
      </Stack>
      <DialogFooter>
        <DefaultButton
          onClick={onDismiss}
          data-cy="dialog-cancel"
          text="Cancel"
        />
        <PrimaryButton
          onClick={() => {
            handleSubmit((data) => {
              restore.execute(id as number, data?.force);
            })();
          }}
          text="Restore"
          disabled={restore?.loading}
          data-cy="dialog-confirm"
        />
      </DialogFooter>
    </Dialog>
  );
};

export default BackupRestoreDialog;
