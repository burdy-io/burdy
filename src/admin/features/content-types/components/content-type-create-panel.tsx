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
import {
  ControlledDropdown,
  ControlledTextField,
} from '@admin/components/rhf-components';
import { composeWrappers } from '@admin/helpers/hoc';
import {
  ContentTypesContextProvider,
  useContentTypes,
} from '../context/content-types.context';
import FieldsList from './fields-list';
import { slugRegex, slugRegexMessage } from '@shared/validators';

interface IContentTypeCreatePanelProps {
  isOpen?: boolean;
  onDismiss?: () => void;
  onCreated?: (contentType?: any) => void;
}

const ContentTypeCreatePanel: React.FC<IContentTypeCreatePanelProps> = ({
  isOpen,
  onDismiss,
  onCreated,
}) => {
  const { createContentType, getComponents } = useContentTypes();

  const [field, setField] = useState({
    fields: [],
  });

  const { control, handleSubmit, reset } = useForm({
    mode: 'all',
  });

  useEffect(() => {
    createContentType.reset();
    getComponents.reset();
    reset();
    setField({
      fields: [],
    });
  }, [isOpen]);

  useEffect(() => {
    if (createContentType?.result) {
      onCreated(createContentType?.result);
    }
  }, [createContentType?.result]);

  const Footer = useCallback(
    () => (
      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <PrimaryButton
          onClick={() => {
            handleSubmit((data) => {
              createContentType.execute({
                ...data,
                fields: field?.fields ?? [],
              });
            })();
          }}
          data-cy="contentTypes-add-confirm"
        >
          Create
        </PrimaryButton>
        <DefaultButton onClick={onDismiss} data-cy="contentTypes-add-cancel">Cancel</DefaultButton>
      </Stack>
    ),
    [field?.fields]
  );

  return (
    <Panel
      isOpen={isOpen}
      headerText="New Content Type"
      isFooterAtBottom
      onRenderFooterContent={Footer}
      onDismiss={onDismiss}
      type={PanelType.medium}
    >
      <LoadingBar loading={false}>
        {createContentType.error?.message && (
          <MessageBar messageBarType={MessageBarType.error}>
            {createContentType.error.message}
          </MessageBar>
        )}
        <Stack tokens={{ childrenGap: 10 }}>
          <ControlledTextField
            defaultValue=""
            control={control}
            name="name"
            label="Name"
            data-cy="contentTypes-add-name"
            autoFocus
            rules={{
              required: 'Name is required',
              pattern: {
                value: slugRegex,
                message: slugRegexMessage,
              }
            }}
          />
          <ControlledDropdown
            defaultValue="page"
            control={control}
            data-cy="contentTypes-add-type"
            options={[
              {
                key: 'page',
                text: 'Page',
              },
              {
                key: 'fragment',
                text: 'Fragment',
              },
              {
                key: 'component',
                text: 'Component',
              },
              {
                key: 'hierarchical_post',
                text: 'Hierarchical Post',
              }
            ]}
            name="type"
            label="Type"
          />
          <div>
            <Label>Fields</Label>
            {isOpen && <FieldsList isRoot field={field} />}
          </div>
        </Stack>
      </LoadingBar>
    </Panel>
  );
};

export default composeWrappers({
  contentTypesContext: ContentTypesContextProvider,
})(ContentTypeCreatePanel);
