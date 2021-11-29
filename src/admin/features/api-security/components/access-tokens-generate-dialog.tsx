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
import { IAccessToken } from '@shared/interfaces/model';
import { useForm } from 'react-hook-form';
import { ControlledTextField } from '@admin/components/rhf-components';

interface IAccessTokensGenerateDialogProps {
  isOpen?: boolean;
  onDismiss?: () => void;
  onGenerate?: (accessToken?: IAccessToken) => void;
}

const AccessTokensGenerateDialog: React.FC<IAccessTokensGenerateDialogProps> =
  ({ isOpen, onDismiss, onGenerate }) => {
    const { generateAccessToken } = useApiSecurity();

    const { control, handleSubmit, reset } = useForm({
      mode: 'all',
      defaultValues: {
        name: '',
      },
    });

    useEffect(() => {
      if (generateAccessToken?.result) {
        onGenerate(generateAccessToken?.result);
        reset({
          name: '',
        });
      }
    }, [generateAccessToken?.result]);

    return (
      <Dialog
        hidden={!isOpen}
        onDismiss={onDismiss}
        dialogContentProps={{
          type: DialogType.close,
          title: 'Generate access token',
        }}
        modalProps={{
          styles: { main: { maxWidth: 450 } },
        }}
      >
        <Stack tokens={{ childrenGap: 8 }}>
          {generateAccessToken.error?.message && (
            <MessageBar messageBarType={MessageBarType.error}>
              {generateAccessToken.error.message}
            </MessageBar>
          )}
          <ControlledTextField
            control={control}
            name="name"
            label="Name"
          />
        </Stack>
        <DialogFooter>
          <DefaultButton
            onClick={onDismiss}
            text="Cancel"
            data-cy="dialog-cancel"
          />
          <PrimaryButton
            onClick={() => {
              handleSubmit((val) => {
                generateAccessToken.execute(val?.name);
              })();
            }}
            text="Generate"
            disabled={generateAccessToken?.loading}
            data-cy="dialog-confirm"
          />
        </DialogFooter>
      </Dialog>
    );
  };

export default AccessTokensGenerateDialog;
