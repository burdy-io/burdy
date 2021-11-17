import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-typescript';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-xml';
import 'ace-builds/src-noconflict/mode-text';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/theme-github';
import { ContentBlock, ContentState } from 'draft-js';
import { v4 } from 'uuid';
import { useRichtext } from '@admin/config-fields/dynamic-richtext.context';
import { Label, makeStyles } from '@fluentui/react';
import React, { useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';

const useStyles = makeStyles((theme) => ({
  editorWrapper: {
    overflowX: 'auto',
    marginLeft: 0,
    marginRight: 0,
  },
  editor: {
    width: '100%',
    borderTop: `1px solid ${theme.palette.neutralLight}`,
    borderBottom: `1px solid ${theme.palette.neutralLight}`,
  },
}));

const DraftAceBlock = (props: any) => {
  const classes = useStyles();
  const contentState = props.contentState as ContentState;
  const contentBlock = props.block as ContentBlock;
  const entityKey = contentBlock.getEntityAt(0);
  const { mode, value } = contentState.getEntity(entityKey).getData();
  const { setEditorProps, editorProps, forceUpdate } = useRichtext();

  const id = useMemo(() => v4(), []);

  const setReadOnly = (readOnly: boolean) => {
    setEditorProps({ ...editorProps, readOnly });
  };

  const debounced = useDebouncedCallback((value) => {
    contentState.mergeEntityData(entityKey, { value });
    forceUpdate();
  }, 500);

  return (
    <div className={classes.editorWrapper}>
      <Label>{mode}</Label>
      <AceEditor
        className={classes.editor}
        name={id}
        readOnly={false}
        mode={mode}
        style={{
          marginLeft: 0,
          marginRight: 0,
          width: '100%',
        }}
        defaultValue={value}
        theme="github"
        onChange={(e) => {
          debounced(e);
        }}
        onFocus={() => {
          setReadOnly(true);
        }}
        onBlur={() => {
          setReadOnly(false);
        }}
        height="250px"
        editorProps={{ $blockScrolling: true }}
        setOptions={{
          useWorker: false,
        }}
      />
    </div>
  );
};

export default DraftAceBlock;
