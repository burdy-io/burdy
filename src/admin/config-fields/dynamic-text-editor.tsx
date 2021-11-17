import AceEditor from 'react-ace';
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
