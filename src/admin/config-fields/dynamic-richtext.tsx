import React, {useMemo} from 'react';
import {convertFromRaw, EditorState} from 'draft-js';
import RichtextContextProvider from '@admin/config-fields/dynamic-richtext.context';
import {AssetsContextProvider} from '@admin/features/assets/context/assets.context';
import 'draft-js/dist/Draft.css';
import {useExtendedFormContext} from '@admin/config-fields/dynamic-form';
import RichText from "@admin/config-fields/richtext/richtext";
import {createLinkDecorator} from "@admin/config-fields/richtext/inline/draft-link-inline";

const DynamicRichText = ({field, name, control}) => {
  const {getValues} = useExtendedFormContext();
  const defaultEditorState = useMemo(() => {
    let value: any = {};
    try {
      value = JSON.parse(getValues(name));
    } catch {
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
