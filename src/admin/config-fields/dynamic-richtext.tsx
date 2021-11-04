import React, { useEffect, useMemo } from 'react';
import { convertFromRaw, EditorState } from 'draft-js';
import RichtextContextProvider from '@admin/config-fields/dynamic-richtext.context';
import { AssetsContextProvider } from '@admin/features/assets/context/assets.context';
import 'draft-js/dist/Draft.css';
import RichText from '@admin/config-fields/richtext/richtext';
import { createLinkDecorator } from '@admin/config-fields/richtext/inline/draft-link-inline';
import { Controller } from 'react-hook-form';

const DynamicRichText = ({ field, name, control }) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: controllerField }) => {
        const defaultEditorState = useMemo(() => {
          let value: any = {};
          try {
            // eslint-disable-next-line no-underscore-dangle
            value = JSON.parse(controllerField.value);
          } catch (err) {
            //
          }

          if (!value?.entityMap) {
            value.entityMap = {};
          }

          if (!value.blocks) {
            value.blocks = [];
          }

          try {
            return EditorState.createWithContent(
              convertFromRaw(value),
              createLinkDecorator()
            );
          } catch (e) {
            return EditorState.createEmpty();
          }
        }, []);

        return (
          <RichtextContextProvider defaultEditorState={defaultEditorState}>
            <AssetsContextProvider>
              <RichText
                field={field}
                name={name}
                onChange={(val) => {
                  controllerField.onChange(val);
                }}
              />
            </AssetsContextProvider>
          </RichtextContextProvider>
        );
      }}
    />
  );
};

export default DynamicRichText;
