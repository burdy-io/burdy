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

const ControlledPostTypesDropdown: React.FC<HookFormProps & IDropdownProps> = (
  props
) => {
  const { getContentTypes } = useContentTypes();

  useEffect(() => {
    getContentTypes.execute({
      type: 'page,post,hierarchical_post',
    });
  }, []);
  return (
    <ControlledDropdown
      {...props}
      options={(getContentTypes?.result ?? []).map((type) => ({
        key: `${type.id}`,
        text: type.name,
      }))}
    />
  );
};

export default composeWrappers({
  contentTypesContext: ContentTypesContextProvider,
})(ControlledPostTypesDropdown);
