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
  const { getSingleContentType } = useContentTypes();

  useEffect(() => {
    if (field?.component) {
      getSingleContentType.execute({ name: field?.component });
    }
  }, [field?.component]);

  return (
    <>
      {field?.label?.length > 0 && <Label>{field?.label}</Label>}
      <LoadingBar loading={getSingleContentType?.loading}>
        <DynamicGroup field={getSingleContentType?.result} name={name} />
      </LoadingBar>
    </>
  );
};

export default composeWrappers({
  contentTypesContext: ContentTypesContextProvider,
})(DynamicComponent);
