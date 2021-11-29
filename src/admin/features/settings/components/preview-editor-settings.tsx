import AceEditor from 'react-ace';
import { v4 } from 'uuid';
import { Label, Stack, makeStyles, PrimaryButton } from '@fluentui/react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ControlledCheckbox,
  ControlledTextField,
} from '@admin/components/rhf-components';
import { Controller, useForm } from 'react-hook-form';
import { findSettingsValue, isTrue } from '@admin/helpers/utility';
import { useSettings } from '@admin/context/settings';
import _ from 'lodash';

const useStyles = makeStyles((theme) => ({
  editor: {
    width: '100%',
    border: `1px solid ${theme.palette.neutralPrimaryAlt}`,
  },
}));

const PreviewEditorSettings = () => {
  const classes = useStyles();

  const { updateSettings, settingsArray } = useSettings();

  const id = useMemo(() => v4(), []);
  const defaultValues = useMemo(() => {
    let state = {
      enabled: false,
      allowedPaths: '',
      rewrites: '',
    };

    const previewEditor = findSettingsValue(settingsArray, 'previewEditor');

    if (previewEditor) {
      try {
        state = JSON.parse(previewEditor);
      } catch {
        //
      }
    }
    return state;
  }, [JSON.stringify(settingsArray)]);

  const { control, watch, handleSubmit } = useForm({
    defaultValues,
  });
  const [values, setValues] = useState<any>(defaultValues);

  useEffect(() => {
    watch((val: any) => {
      setValues(val);
    });
  }, []);

  return (
    <Stack tokens={{ childrenGap: 8, maxWidth: 600 }}>
      <ControlledCheckbox
        control={control}
        name="enabled"
        label="Enable Preview Editor"
      />
      <ControlledTextField
        control={control}
        disabled={!isTrue(values?.enabled)}
        name="allowedPaths"
        label="Allowed Sites Paths"
        multiline
        description="Defines which posts, pages or hierarchical_posts are valid for the preview editor. To define multiple paths just add new row. We are using path-to-regexp internally to find match"
        placeholder={'website/*\ninternal/*'}
      />
      <Stack tokens={{ childrenGap: 8 }}>
        <Label>Preview Editor Rewrites (json)</Label>
        <Controller
          name="rewrites"
          control={control}
          render={({ field: { onChange, value } }) => (
            <AceEditor
              className={classes.editor}
              name={id}
              readOnly={!isTrue(values?.enabled)}
              mode="json"
              placeholder={JSON.stringify(
                [
                  {
                    source: 'website/en',
                    rewrite: 'http://localhost:3000/',
                  },
                  {
                    source: 'website/en/:path*',
                    rewrite: 'http://localhost:3000/{path}',
                  },
                  {
                    source: 'website/:path*',
                    rewrite: 'http://localhost:3000/{path}',
                  },
                ],
                null,
                2
              )}
              style={{
                marginLeft: 0,
                marginRight: 0,
                width: '100%',
              }}
              defaultValue={value}
              theme="github"
              onChange={onChange}
              height="300px"
              editorProps={{ $blockScrolling: true }}
              setOptions={{
                useWorker: false,
              }}
            />
          )}
        />
      </Stack>
      <Stack horizontal horizontalAlign={'end'}>
        <PrimaryButton
          disabled={_.isEqual(values, defaultValues)}
          onClick={() => {
            handleSubmit((val) => {
              const stringified = JSON.stringify(val);
              updateSettings.execute('previewEditor', stringified);
            })();
          }}
        >
          Update
        </PrimaryButton>
      </Stack>
    </Stack>
  );
};

export default PreviewEditorSettings;
