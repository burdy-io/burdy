import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DefaultButton,
  IColumn,
  Panel,
  PanelType,
  PrimaryButton,
  Selection,
  SelectionMode,
  ShimmeredDetailsList,
  Stack,
} from '@fluentui/react';
import { composeWrappers } from '@admin/helpers/hoc';
import {
  ContentTypesContextProvider,
  useContentTypes,
} from '../context/content-types.context';

interface IContentTypesComponentsSelectPanelProps {
  isOpen?: boolean;
  ids?: string[];
  error?: string;
  filter?: any;
  selectionMode?: SelectionMode;
  onDismiss?: () => void;
  onSubmit?: (e: any) => void;
}

const ContentTypesComponentsSelectPanel: React.FC<IContentTypesComponentsSelectPanelProps> =
  ({
    isOpen,
    onDismiss,
    selectionMode = SelectionMode.single,
    onSubmit,
    filter,
  }) => {
    const { getContentTypes } = useContentTypes();

    const [selectedItems, setSelectedItems] = useState(null);

    const selection = useMemo(
      () =>
        new Selection<any>({
          onSelectionChanged: () => {
            setSelectedItems(selection.getSelection());
          },
        }),
      []
    );

    useEffect(() => {
      if (isOpen) {
        getContentTypes.execute(filter);
      }
    }, [isOpen]);

    const Footer = useCallback(
      () => (
        <Stack horizontal tokens={{ childrenGap: 10 }}>
          <PrimaryButton
            disabled={!(selectedItems?.length > 0)}
            onClick={() => {
              onSubmit(selectedItems);
            }}
          >
            Select
          </PrimaryButton>
          <DefaultButton onClick={onDismiss}>Cancel</DefaultButton>
        </Stack>
      ),
      [isOpen, selectedItems]
    );

    const columns = useMemo<IColumn[]>(
      () => [
        {
          key: 'name',
          name: 'Name',
          fieldName: 'name',
          minWidth: 100,
          isPadded: true,
        },
      ],
      []
    );

    return (
      <Panel
        isOpen={isOpen}
        headerText="Select components"
        isFooterAtBottom
        onRenderFooterContent={Footer}
        onDismiss={onDismiss}
        type={PanelType.medium}
      >
        <ShimmeredDetailsList
          setKey="items"
          items={getContentTypes?.result || []}
          columns={columns}
          selectionMode={selectionMode}
          selection={selection}
          enableShimmer={getContentTypes.loading}
          ariaLabelForShimmer="Components are being fetched"
          ariaLabelForGrid="Item details"
        />
      </Panel>
    );
  };

export default composeWrappers({
  contentTypesContext: ContentTypesContextProvider,
})(ContentTypesComponentsSelectPanel);
