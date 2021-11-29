import { Stack, PrimaryButton } from '@fluentui/react';
import React, { useEffect, useMemo, useState } from 'react';
import { ControlledDropdown } from '@admin/components/rhf-components';
import { useForm } from 'react-hook-form';
import { findSettingsValue, isTrue } from '@admin/helpers/utility';
import { useSettings } from '@admin/context/settings';
import _ from 'lodash';

const ApiAccessSettings = () => {
  const { updateSettings, settingsArray } = useSettings();

  const defaultValues = useMemo(() => {
    const apiAccess = findSettingsValue(settingsArray, 'apiAccess');
    return {
      apiAccess: apiAccess || 'public',
    };
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
      <ControlledDropdown
        control={control}
        name="apiAccess"
        options={[
          {
            key: 'public',
            text: 'Public - Requires access token for drafts and search',
          },
          {
            key: 'private',
            text: 'Private - Requires access token for all post content requests',
          },
        ]}
      />
      <Stack horizontal horizontalAlign={'end'}>
        <PrimaryButton
          disabled={_.isEqual(values, defaultValues)}
          onClick={() => {
            handleSubmit((val) => {
              updateSettings.execute('apiAccess', val?.apiAccess);
            })();
          }}
        >
          Update
        </PrimaryButton>
      </Stack>
    </Stack>
  );
};

export default ApiAccessSettings;
