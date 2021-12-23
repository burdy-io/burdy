import { ContentBlock, ContentState, EditorState, Modifier, SelectionState } from 'draft-js';
import { useRichtext } from '@admin/config-fields/dynamic-richtext.context';
import {
  DefaultButton, IconButton,
  Label,
  makeStyles,
  Panel,
  PanelType,
  PrimaryButton,
  Stack
} from '@fluentui/react';
import React, { useEffect, useRef, useState } from 'react';
import { composeWrappers } from '@admin/helpers/hoc';
import {
  ContentTypesContextProvider,
  useContentTypes,
} from '@admin/features/content-types/context/content-types.context';
import DynamicGroup from '@admin/config-fields/dynamic-group';
import LoadingBar from '@admin/components/loading-bar';
import { useForm, FormProvider } from 'react-hook-form';
import {
  FormHelperContextProvider,
  useExtendedFormContext,
} from '@admin/config-fields/dynamic-form';

const useStyles = makeStyles((theme) => ({
  form: {
    boxShadow: theme.effects.elevation16,
    padding: 24,
    maxWidth: 960,
    position: 'relative',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
}));

const DraftComponentBlockFormWrapper = (props: any) => {
  const { name, value, field, open, onDismiss, onSave } = props;

  const { disabled } = useExtendedFormContext();

  const methods = useForm({
    mode: 'all',
    shouldUnregister: true,
  });

  useEffect(() => {
    if (open) {
      methods.reset(value);
    }
  }, [open]);

  return (
    <Panel
      isOpen={open}
      headerText={name}
      isFooterAtBottom
      onRenderFooterContent={() => (
        <Stack horizontal tokens={{ childrenGap: 10 }}>
          <PrimaryButton
            onClick={() => {
              methods.handleSubmit((val) => {
                onSave?.(val);
              })();
            }}
          >
            Save
          </PrimaryButton>
          <DefaultButton
            onClick={() => {
              onDismiss();
            }}
          >
            Cancel
          </DefaultButton>
        </Stack>
      )}
      onDismiss={() => onDismiss()}
      type={PanelType.custom}
      customWidth={400 as any}
    >
      <FormProvider {...methods}>
        <FormHelperContextProvider disabled={disabled} narrow>
          <DynamicGroup field={field} />
        </FormHelperContextProvider>
      </FormProvider>
    </Panel>
  );
};

const DraftComponentBlock = (props: any) => {
  const ref = useRef();
  const classes = useStyles();
  const contentState = props.contentState as ContentState;
  const contentBlock = props.block as ContentBlock;
  const entityKey = contentBlock.getEntityAt(0);

  const [panelOpened, setPanelOpened] = useState(false);

  const { name, value } = contentState.getEntity(entityKey).getData();
  const { setEditorProps, editorProps, forceUpdate, editorState, setEditorState } = useRichtext();

  const setReadOnly = (readOnly: boolean) => {
    setEditorProps({ ...editorProps, readOnly });
  };

  const { getSingleContentType } = useContentTypes();
  useEffect(() => {
    if (name) {
      getSingleContentType.execute({ name });
    }
  }, [name]);

  useEffect(() => {
    setReadOnly(panelOpened);
  }, [panelOpened]);

  return (
    <div ref={ref} className={classes.form}>
      <Stack horizontal horizontalAlign="space-between">
        <Label>{name}</Label>
        <Stack horizontal tokens={{childrenGap: 8}}>
          <IconButton
            iconProps={{ iconName: 'Edit' }}
            disabled={getSingleContentType?.loading || !!getSingleContentType?.error}
            title="Edit"
            ariaLabel="Edit"
            onClick={() => setPanelOpened(true)}
          />
          <IconButton
            iconProps={{ iconName: 'Delete' }}
            disabled={getSingleContentType?.loading}
            title="Delete"
            ariaLabel="Delete"
            onClick={() => {
              const blockKey = contentBlock.getKey();
              const previousSelection = editorState.getSelection();
              const selection = SelectionState.createEmpty(blockKey).merge({focusOffset: contentBlock.getLength()});

              const newContentState = Modifier.removeRange(
                contentState,
                selection,
                'backward'
              );

              const blockMap = newContentState.getBlockMap().delete(contentBlock.getKey());
              const withoutAtomic = newContentState.merge({
                blockMap,
                selectionAfter: selection,
              });

              const newEditorState = EditorState.push(
                editorState,
                withoutAtomic as any,
                'remove-range',
              );

              setEditorState(
                EditorState.forceSelection(newEditorState, previousSelection)
              )
            }}
          />
        </Stack>
      </Stack>
      <LoadingBar loading={getSingleContentType?.loading}>
        <DraftComponentBlockFormWrapper
          open={panelOpened}
          name={name}
          value={value}
          onSave={(val) => {
            contentState.mergeEntityData(entityKey, { value: val });
            forceUpdate();
            setPanelOpened(false);
          }}
          onDismiss={() => {
            setPanelOpened(false);
          }}
          field={getSingleContentType?.result}
        />
      </LoadingBar>
    </div>
  );
};

export default composeWrappers({
  contentTypesContext: ContentTypesContextProvider,
})(DraftComponentBlock);
