import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  PrimaryButton,
  Stack,
} from '@fluentui/react';
import { ControlledCombobox } from '@admin/components/rhf-components';

interface IInsertAceDialogProps {
  isOpen?: boolean;
  onDismiss?: () => void;
  onInsert?: (data?: any) => void;
}

const InsertAceDialog: React.FC<IInsertAceDialogProps> = ({
  isOpen,
  onDismiss,
  onInsert,
}) => {
  const { control, handleSubmit, reset } = useForm({
    mode: 'all',
    defaultValues: {
      mode: 'json',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        mode: 'json',
      });
    }
  }, [isOpen]);

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: 'Insert Ace Editor',
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
        <ControlledCombobox
          control={control}
          name="mode"
          label="Mode"
          options={[
            {
              key: 'json',
              text: 'Json',
            },
            {
              key: 'xml',
              text: 'Xml',
            },
            {
              key: 'yaml',
              text: 'Yaml',
            },
            {
              key: 'javascript',
              text: 'Javascript',
            },
            {
              key: 'typescript',
              text: 'Typescript',
            },
            {
              key: 'markdown',
              text: 'Markdown',
            },
            {
              key: 'text',
              text: 'Plain Text',
            },
            {
              key: 'html',
              text: 'Html',
            },
            {
              key: 'css',
              text: 'Css',
            },
            {
              key: 'sql',
              text: 'Sql',
            },
          ]}
        />
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

export default InsertAceDialog;
