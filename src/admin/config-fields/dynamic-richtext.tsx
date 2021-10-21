import React, {useMemo} from 'react';
import {convertFromRaw, EditorState} from 'draft-js';
import RichtextContextProvider from '@admin/config-fields/dynamic-richtext.context';
import {AssetsContextProvider} from '@admin/features/assets/context/assets.context';
import 'draft-js/dist/Draft.css';
import RichText from "@admin/config-fields/richtext/richtext";
import {createLinkDecorator} from "@admin/config-fields/richtext/inline/draft-link-inline";
import { get } from 'lodash';

const DynamicRichText = ({field, name, control}) => {
  const defaultEditorState = useMemo(() => {
    let value: any = {};
    try {
      // eslint-disable-next-line no-underscore-dangle
      value = JSON.parse(get(control._defaultValues, name));
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
        <RichText field={field} name={name} control={control}/>
      </AssetsContextProvider>
    </RichtextContextProvider>
  );
};

export default DynamicRichText;
