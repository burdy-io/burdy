import React, { useCallback, useEffect, useState } from 'react';
import {
  DefaultButton,
  Label,
  MessageBar,
  MessageBarType,
  Panel,
  PanelType,
  PrimaryButton,
  Stack,
} from '@fluentui/react';
import LoadingBar from '@admin/components/loading-bar';
import { useForm } from 'react-hook-form';
import { ControlledTextField } from '@admin/components/rhf-components';
import { composeWrappers } from '@admin/helpers/hoc';
import { useSnackbar } from '@admin/context/snackbar';
import {
  ContentTypesContextProvider,
  useContentTypes,
} from '../context/content-types.context';
import FieldsList from './fields-list';
import { slugRegex, slugRegexMessage } from '@shared/validators';

interface IContentTypeUpdatePanelProps {
  isOpen?: boolean;
  contentTypeId?: number;
  onDismiss?: () => void;
  onUpdated?: (data: any) => void;
}

const ContentTypeUpdatePanel: React.FC<IContentTypeUpdatePanelProps> = ({
  isOpen,
  contentTypeId,
  onDismiss,
  onUpdated,
}) => {
  const { updateContentType, getContentType, getComponents } =
    useContentTypes();

  const { openSnackbar } = useSnackbar();

  const [field, setField] = useState({
    fields: [],
  });

  const { control, handleSubmit, reset } = useForm({
    mode: 'all',
  });

  useEffect(() => {
    if (getContentType.result) {
      setField(getContentType.result as any);
    }
  }, [getContentType.result]);

  useEffect(() => {
    updateContentType.reset();
    getContentType.reset();
    getComponents.reset();
    reset();
    setField({
      fields: [],
    });
  }, [isOpen]);

  useEffect(() => {
    if (contentTypeId && isOpen) {
      getContentType.execute(contentTypeId);
    }
  }, [contentTypeId, isOpen]);

  useEffect(() => {
    if (updateContentType?.result && isOpen) {
      onUpdated(updateContentType?.result);
      openSnackbar({
        message: 'Content typed updated',
        messageBarType: MessageBarType.success,
      });
    }
  }, [updateContentType?.result]);

  const Footer = useCallback(
    () => (
      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <PrimaryButton
          disabled={
            !getContentType.result ||
            getContentType.loading ||
            updateContentType.loading
          }
          onClick={() => {
            handleSubmit((data) => {
              updateContentType.execute(contentTypeId, {
                ...data,
                fields: field?.fields,
              });
            })();
          }}
          data-cy="contentTypes-edit-confirm"
        >
          Update
        </PrimaryButton>
        <DefaultButton onClick={onDismiss} data-cy="contentTypes-edit-cancel">Cancel</DefaultButton>
      </Stack>
    ),
    [getContentType?.result, field?.fields]
  );

  return (
    <>
      <Panel
        isOpen={isOpen}
        headerText="Update Content Type"
        isFooterAtBottom
        onRenderFooterContent={Footer}
        onDismiss={onDismiss}
        type={PanelType.medium}
      >
        <LoadingBar loading={getContentType.loading}>
          {updateContentType.error?.message && (
            <MessageBar messageBarType={MessageBarType.error}>
              {updateContentType.error.message}
            </MessageBar>
          )}
          {getContentType.error?.message && (
            <MessageBar messageBarType={MessageBarType.error}>
              {getContentType.error.message}
            </MessageBar>
          )}
          {getContentType.result && (
            <Stack tokens={{ childrenGap: 10 }}>
              <ControlledTextField
                defaultValue={getContentType?.result?.name}
                control={control}
                name="name"
                label="Name"
                data-cy="contentTypes-edit-name"
                rules={{
                  required: 'Name is required',
                  pattern: {
                    value: slugRegex,
                    message: slugRegexMessage,
                  }
                }}
              />
              <div>
                <Label>Fields</Label>
                {isOpen && <FieldsList isRoot field={field} />}
              </div>
            </Stack>
          )}
        </LoadingBar>
      </Panel>
    </>
  );
};

export default composeWrappers({
  contentTypesContext: ContentTypesContextProvider,
})(ContentTypeUpdatePanel);
