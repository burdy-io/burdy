import React, { useEffect, useMemo } from 'react';
import { Label, Separator, Stack } from '@fluentui/react';
import { composeWrappers } from '@admin/helpers/hoc';
import {
  ContentTypesContextProvider,
  useContentTypes,
} from '@admin/features/content-types/context/content-types.context';
import LoadingBar from '@admin/components/loading-bar';
import DynamicGroup from './dynamic-group';
import { ControlledCheckbox } from '@admin/components/rhf-components';
import { useExtendedFormContext } from '@admin/config-fields/dynamic-form';
import { isTrue } from '@admin/helpers/utility';
import { usePosts } from '@admin/features/posts/context/posts.context';
import { v4 } from 'uuid';

interface DynamicComponentProps {
  field: any;
  name?: string;
}

const DynamicComponent: React.FC<DynamicComponentProps> = ({ field, name }) => {
  const { getSingleContentType } = useContentTypes();
  const {setLoadingContent} = usePosts();
  const { disabled, control, watch } = useExtendedFormContext();

  useEffect(() => {
    if (field?.component) {
      getSingleContentType.execute({ name: field?.component });
    }
  }, [field?.component]);

  useEffect(() => {
    const id = v4();
    setLoadingContent(id, getSingleContentType?.loading);
    return () => {
      setLoadingContent(id, false);
    }
  }, [getSingleContentType?.loading])

  const enabled = watch(`${name}_$enabled`);
  const displayComponent = useMemo(() => {
    if (!isTrue(field?.allowToggle)) return true;
    return isTrue(enabled);
  }, [enabled, field?.allowToggle]);

  return (
    <>
      <div>
        <Stack
          horizontal
          horizontalAlign="space-between"
          verticalAlign="center"
          tokens={{ childrenGap: 8 }}
        >
          <Label>{field?.label?.length > 0 ? field?.label : field?.name}</Label>
          {isTrue(field?.allowToggle) && (
            <ControlledCheckbox
              disabled={disabled}
              control={control}
              label="Enable"
              name={`${name}_$enabled`}
            />
          )}
        </Stack>
        <Separator />
      </div>
      <LoadingBar loading={getSingleContentType?.loading}>
        {displayComponent && (
          <DynamicGroup field={getSingleContentType?.result} name={name} />
        )}
      </LoadingBar>
    </>
  );
};

export default composeWrappers({
  contentTypesContext: ContentTypesContextProvider,
})(DynamicComponent);
