import { ContentBlock, ContentState } from 'draft-js';
import { useRichtext } from '@admin/config-fields/dynamic-richtext.context';
import { Label, makeStyles } from '@fluentui/react';
import React, { useEffect, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { composeWrappers } from '@admin/helpers/hoc';
import {
  ContentTypesContextProvider,
  useContentTypes,
} from '@admin/features/content-types/context/content-types.context';
import DynamicGroup from '@admin/config-fields/dynamic-group';
import LoadingBar from '@admin/components/loading-bar';
import { useForm, FormProvider } from 'react-hook-form';
import { FormHelperContextProvider, useExtendedFormContext } from '@admin/config-fields/dynamic-form';

const useStyles = makeStyles((theme) => ({
  form: {
    boxShadow: theme.effects.elevation16,
    padding: 24,
    maxWidth: 960,
    position: 'relative',
    minHeight: 100,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
}));

const DraftComponentBlock = (props: any) => {
  const ref = useRef();
  const classes = useStyles();
  const contentState = props.contentState as ContentState;
  const contentBlock = props.block as ContentBlock;
  const entityKey = contentBlock.getEntityAt(0);

  const {disabled} = useExtendedFormContext();

  const { name, value } = contentState.getEntity(entityKey).getData();
  const { setEditorProps, editorProps, forceUpdate } = useRichtext();

  const setReadOnly = (readOnly: boolean) => {
    setEditorProps({ ...editorProps, readOnly });
  };

  const { getSingleContentType } = useContentTypes();
  useEffect(() => {
    if (name) {
      getSingleContentType.execute({ name });
    }
  }, [name]);

  const methods = useForm({
    mode: 'all',
    shouldUnregister: true
  });

  const debounced = useDebouncedCallback((value) => {
    contentState.mergeEntityData(entityKey, { value });
    forceUpdate();
  }, 300);

  const handleClickOutside = e => {
    // @ts-ignore
    if (!ref?.current?.contains?.(e?.target)) {
      setReadOnly(false);
    }
  };

  useEffect(() => {
    methods.reset(value);
    methods.watch((val) => {
      debounced(val);
    });
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={ref}
      className={classes.form}
      onFocus={() => {
        setReadOnly(true);
      }}
      onBlur={(e) => {
        const relatedTarget = e?.relatedTarget as Element;
        if (!e?.currentTarget?.contains(relatedTarget) && relatedTarget) {
          setReadOnly(false);
        }
      }}
    >
      <Label>{name}</Label>
      <FormProvider {...methods}>
        <FormHelperContextProvider disabled={disabled} narrow>
          <LoadingBar loading={getSingleContentType?.loading}>
            <DynamicGroup field={getSingleContentType?.result} />
          </LoadingBar>
        </FormHelperContextProvider>
      </FormProvider>
    </div>
  );
};

export default composeWrappers({
  contentTypesContext: ContentTypesContextProvider,
})(DraftComponentBlock);
