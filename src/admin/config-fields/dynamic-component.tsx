import React, { useEffect } from 'react';
import { Label } from '@fluentui/react';
import { composeWrappers } from '@admin/helpers/hoc';
import {
  ContentTypesContextProvider,
  useContentTypes,
} from '@admin/features/content-types/context/content-types.context';
import LoadingBar from '@admin/components/loading-bar';
import DynamicGroup from './dynamic-group';

interface DynamicComponentProps {
  field: any;
  name?: string;
}

const DynamicComponent: React.FC<DynamicComponentProps> = ({ field, name }) => {
  const { getContentType } = useContentTypes();

  useEffect(() => {
    if (field?.component) {
      getContentType.execute(field?.component);
    }
  }, [field?.component]);

  return (
    <>
      {field?.label?.length > 0 && <Label>{field?.label}</Label>}
      <LoadingBar loading={getContentType?.loading}>
        <DynamicGroup field={getContentType?.result} name={name} />
      </LoadingBar>
    </>
  );
};

export default composeWrappers({
  contentTypesContext: ContentTypesContextProvider,
})(DynamicComponent);
