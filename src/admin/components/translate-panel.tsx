import { getTheme, PanelType, PrimaryButton, Stack } from '@fluentui/react';
import BackPanel from '@admin/components/back-panel';
import React, { useState } from 'react';
import {
  ControlledDropdown,
  ControlledTextField,
} from '@admin/components/rhf-components';
import { useForm } from 'react-hook-form';

const theme = getTheme();

const TranslatePanel = () => {
  const [panelOpened, setPanelOpened] = useState(false);

  const { control } = useForm();
  return (
    <div>
      <PrimaryButton
        style={{
          color: `${theme.palette.white} !important`,
          height: 48,
        }}
        onClick={() => setPanelOpened(true)}
      >
        Translate
      </PrimaryButton>
      <BackPanel
        isOpen={panelOpened}
        headerText="Translate"
        isBlocking={false}
        isFooterAtBottom
        isHiddenOnDismiss
        onBack={() => setPanelOpened(false)}
        onDismiss={() => setPanelOpened(false)}
        type={PanelType.custom}
        customWidth={400 as any}
      >
        <Stack tokens={{ childrenGap: 10 }}>
          <ControlledDropdown
            control={control}
            name={'provider'}
            options={[
              {
                key: 'aws',
                text: 'AWS',
              },
              {
                key: 'azure',
                text: 'Azure',
              },
              {
                key: 'google',
                text: 'Google',
              },
            ]}
            label="Provider"
          />
          <ControlledDropdown
            control={control}
            name={'sourceLang'}
            options={[]}
            label="Source Language"
          />
          <ControlledTextField
            control={control}
            name={'source'}
            label="Source"
            rows={10}
            multiline
          />
          <ControlledDropdown
            control={control}
            name={'targetLanguage'}
            options={[]}
            label="Target Language"
          />
          <ControlledTextField
            control={control}
            rows={10}
            name={'target'}
            label="Target"
            multiline
          />
          <Stack horizontal horizontalAlign={'end'}>
            <PrimaryButton>Translate</PrimaryButton>
          </Stack>
        </Stack>
      </BackPanel>
    </div>
  );
};

export default TranslatePanel;
