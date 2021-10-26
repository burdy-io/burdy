import React, { useCallback, useEffect } from 'react';
import {
  DefaultButton,
  MessageBar,
  MessageBarType,
  Panel,
  PanelType,
  PrimaryButton,
  Stack
} from '@fluentui/react';
import { FormProvider, useForm } from 'react-hook-form';
import { ControlledTextField } from '@admin/components/rhf-components';
import { useContentTypes } from '@admin/features/content-types/context/content-types.context';
import LoadingBar from '@admin/components/loading-bar';
import DynamicGroup from '../../../config-fields/dynamic-group';
import camelCase from 'camelcase';
import { FormHelperContextProvider } from '@admin/config-fields/dynamic-form';

interface IFieldsConfigurePanelProps {
  isOpen?: boolean;
  type?: string;
  component?: string;
  field?: any;
  error?: string;
  onDismiss?: () => void;
  onSubmit?: (e: any) => void;
}

const FieldsConfigurePanel: React.FC<IFieldsConfigurePanelProps> = ({
                                                                      isOpen,
                                                                      onDismiss,
                                                                      error,
                                                                      onSubmit,
                                                                      field,
                                                                      type
                                                                    }) => {
  const methods = useForm({
    mode: 'all',
    defaultValues: field
  });

  useEffect(() => {
    if (!methods.formState?.dirtyFields?.name && methods.watch('label')) {
      const cc = camelCase(methods.watch('label'));
      methods.setValue('name', cc);
    }
  }, [methods.watch('label')]);

  const { getField } = useContentTypes();

  useEffect(() => {
    if (isOpen) {
      methods.reset(field);
      getField.execute(type);
    }
  }, [isOpen]);

  const onSave = () => {
    console.log('save');
    methods.handleSubmit((data) => {
      const obj: any = {
        type,
        ...data,
        index: field?.index
      };

      onSubmit(obj);
    })();
  };

  const Footer = useCallback(
    () => (
      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <PrimaryButton onClick={onSave} data-cy='contentTypes-fieldsConfig-confirm'>
          {field ? 'Update ' : 'Add'}
        </PrimaryButton>
        <DefaultButton onClick={onDismiss} data-cy='contentTypes-fieldsConfig-cancel'>Cancel</DefaultButton>
      </Stack>
    ),
    [getField?.result, field]
  );

  return (
    <Panel
      isOpen={isOpen}
      headerText={field ? `Update ${type}` : `Add new ${type}`}
      isFooterAtBottom
      onRenderFooterContent={Footer}
      onDismiss={onDismiss}
      type={PanelType.medium}
      data-cy='contentTypes-fieldsConfig'
    >
      <div>
        <LoadingBar loading={getField.loading}>
          {error && (
            <MessageBar messageBarType={MessageBarType.error}>
              {error}
            </MessageBar>
          )}
          <FormProvider {...methods}>
            <FormHelperContextProvider>
              <Stack tokens={{ childrenGap: 10 }}>
                <ControlledTextField
                  defaultValue={field?.label ?? ''}
                  control={methods.control}
                  name='label'
                  label='Label'
                  data-cy='contentTypes-fieldsConfig-label'
                  autoFocus
                />
                <ControlledTextField
                  defaultValue={field?.name ?? ''}
                  control={methods.control}
                  name='name'
                  label='Name'
                  data-cy='contentTypes-fieldsConfig-name'
                  rules={{
                    required: 'Name is required'
                  }}
                />
                {getField?.result && <DynamicGroup field={getField?.result} />}
              </Stack>
            </FormHelperContextProvider>
          </FormProvider>
        </LoadingBar>
      </div>
    </Panel>
  );
};

export default FieldsConfigurePanel;
