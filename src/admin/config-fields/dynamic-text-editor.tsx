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
import React from 'react';
import { Controller } from 'react-hook-form';
import { Label, makeStyles } from '@fluentui/react';

const useStyles = makeStyles((theme) => ({
  editorWrapper: {
    overflowX: 'auto'
  },
  editor: {
    width: '100%',
    borderTop: `1px solid ${theme.palette.neutralLight}`,
    borderBottom: `1px solid ${theme.palette.neutralLight}`
  }
}));

const DynamicTextEditor = ({ field, name, control, disabled }) => {
  const styles = useStyles();

  return (
    <div className={styles.editorWrapper}>
      <Label>{field.label || field.name} ({field.mode})</Label>
      <Controller
        name={name}
        control={control}
        render={({ field: controllerField }) => {
          return <AceEditor
            readOnly={disabled}
            mode={field.mode}
            className={styles.editor}
            style={{
              width: '100%'
            }}
            defaultValue={controllerField.value}
            theme='github'
            onChange={controllerField.onChange}
            name={name}
            height='350px'
            editorProps={{ $blockScrolling: true }}
            setOptions={{
              useWorker: false
            }}
          />;
        }}
      />
    </div>
  );
};

export default DynamicTextEditor;
