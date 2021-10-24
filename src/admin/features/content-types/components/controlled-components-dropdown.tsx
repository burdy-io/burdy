import React, { useEffect } from 'react';
import { IDropdownProps } from '@fluentui/react';
import {
  ContentTypesContextProvider,
  useContentTypes,
} from '@admin/features/content-types/context/content-types.context';
import {
  ControlledDropdown,
  HookFormProps,
} from '@admin/components/rhf-components';
import { composeWrappers } from '@admin/helpers/hoc';

const ControlledComponentsDropdown: React.FC<HookFormProps & IDropdownProps> = (
  props
) => {
  const { getComponents } = useContentTypes();

  useEffect(() => {
    getComponents.execute();
  }, []);

  return (
    <ControlledDropdown
      {...props}
      options={(getComponents?.result ?? []).map((component) => ({
        key: `${component.name}`,
        text: component.name,
      }))}
    />
  );
};

export default composeWrappers({
  contentTypesContext: ContentTypesContextProvider,
})(ControlledComponentsDropdown);
