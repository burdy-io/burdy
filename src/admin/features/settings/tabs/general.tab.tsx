import React, { useCallback, useEffect } from 'react';
import LoadingBar from '@admin/components/loading-bar';
import { DefaultButton, PrimaryButton, Stack } from '@fluentui/react';
import { useSettings } from '@admin/context/settings';
import Heading from '@admin/components/heading';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ControlledTextField } from '@admin/components/rhf-components';
import StatusBar from '@admin/components/status-bar';
import Validators from '@shared/validators';

const schema = yup.object({
  adminEmail: Validators.email().label('Admin Email'),
});

const GeneralSettings = () => {
  const { getMainSettings, updateMainSettings } = useSettings();
  const { control, handleSubmit, reset, formState } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {},
  });

  const submit = handleSubmit(updateMainSettings.execute);

  useEffect(() => {
    getMainSettings.execute();

    return () => {
      updateMainSettings.reset();
      getMainSettings.reset();
    };
  }, []);

  useEffect(() => {
    reset(getMainSettings.result);
  }, [getMainSettings.result]);

  const dismissStatus = useCallback(() => {
    getMainSettings.execute().then(() => {
      reset();
      updateMainSettings.reset();
    });
  }, [reset, updateMainSettings]);

  return (
    <div>
      <Heading title="General Settings" noPadding>
        Here you will find general settings about the website configuration.
      </Heading>
      <LoadingBar loading={getMainSettings.loading}>
        <form onSubmit={submit}>
          <StatusBar
            controller={updateMainSettings}
            onDismiss={dismissStatus}
            successMessage="Successfully updated"
          />
          <Stack tokens={{ childrenGap: 20 }} horizontalAlign="start">
            <Stack tokens={{ childrenGap: 10 }} horizontalAlign="start">
              <ControlledTextField
                control={control}
                label="Admin Email"
                name="adminEmail"
                type="email"
                data-cy="settings-adminEmail"
                style={{ minWidth: 400 }}
                required
              />
            </Stack>
            <Stack horizontal tokens={{ childrenGap: 10 }}>
              <PrimaryButton
                type="submit"
                data-cy="settings-submit"
                disabled={updateMainSettings.loading || !formState.isDirty}
              >
                Save
              </PrimaryButton>
              <DefaultButton
                onClick={() => reset()}
                disabled={updateMainSettings.loading || !formState.isDirty}
              >
                Reset
              </DefaultButton>
            </Stack>
          </Stack>
        </form>
      </LoadingBar>
    </div>
  );
};

export default GeneralSettings;
