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
import { useApiSecurity } from '@admin/features/api-security/context/api-security.context';

interface IAccessTokensDeleteDialogProps {
  isOpen?: boolean;
  onDismiss?: () => void;
  onDeleted?: (ids?: string[] | number[]) => void;
}

const AccessTokensDeleteDialog: React.FC<IAccessTokensDeleteDialogProps> = ({
  isOpen,
  onDismiss,
  onDeleted,
}) => {
  const { deleteAccessTokens, selectedAccessTokens } = useApiSecurity();

  useEffect(() => {
    deleteAccessTokens?.reset?.();
  }, [isOpen]);

  useEffect(() => {
    if (deleteAccessTokens?.result) {
      onDeleted(deleteAccessTokens?.result);
    }
  }, [deleteAccessTokens?.result]);

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
        {deleteAccessTokens?.error?.message && (
          <MessageBar messageBarType={MessageBarType.error}>
            {deleteAccessTokens?.error.message}
          </MessageBar>
        )}
      </Stack>
      <DialogFooter>
        <DefaultButton
          onClick={onDismiss}
          text="Cancel"
          data-cy="dialog-cancel"
        />
        <PrimaryButton
          onClick={() => {
            deleteAccessTokens.execute(
              selectedAccessTokens?.map((at) => at?.id)
            );
          }}
          text="Delete"
          disabled={deleteAccessTokens?.loading}
          data-cy="dialog-confirm"
        />
      </DialogFooter>
    </Dialog>
  );
};

export default AccessTokensDeleteDialog;
