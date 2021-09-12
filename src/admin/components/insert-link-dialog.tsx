import { ControlledCombobox, ControlledTextField } from '@admin/components/rhf-components';
import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  PrimaryButton,
  Stack,
} from '@fluentui/react';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface IInsertLinkDialogProps {
  isOpen?: boolean;
  onDismiss?: () => void;
  onInsert?: (data?: any) => void;
}

const InsertLinkDialog: React.FC<IInsertLinkDialogProps> = ({
  isOpen,
  onDismiss,
  onInsert,
}) => {
  const { control, handleSubmit, reset } = useForm({
    mode: 'all',
    defaultValues: {
      target: '_self',
    }
  });

  useEffect(() => {
    if (isOpen) {
    reset({
      target: '_self',
    });
    }
  }, [isOpen]);

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: 'Insert link',
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
        <ControlledTextField name="url" label="URL" control={control} />
        <ControlledCombobox control={control} name="target" label="Target" options={[{
          key: '_self',
          text: 'Self',
        }, {
          key: '_blank',
          text: 'Blank',
        }]} />
      </Stack>
      <DialogFooter>
        <DefaultButton onClick={onDismiss} text="Cancel" />
        <PrimaryButton
          onClick={() => {
            handleSubmit((data) => {
              onInsert(data);
            })();
          }}
          text="Insert"
        />
      </DialogFooter>
    </Dialog>
  );
};

export default InsertLinkDialog;
