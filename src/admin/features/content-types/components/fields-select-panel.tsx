import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DefaultButton,
  getTheme,
  IColumn,
  Icon,
  mergeStyleSets,
  Panel,
  PanelType,
  PrimaryButton,
  SearchBox,
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
import FieldsConfigurePanel from './fields-configure-panel';

const theme = getTheme();

const styles = mergeStyleSets({
  iconCell: {
    height: 30,
    width: 30,
    fontSize: 16,
    backgroundColor: theme.palette.neutralLight,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

interface IFieldsSelectPanelProps {
  isOpen?: boolean;
  type?: string;
  error?: string;
  onDismiss?: () => void;
  onSubmit?: (e: any) => void;
}

const FieldsSelectPanel: React.FC<IFieldsSelectPanelProps> = ({
  isOpen,
  onDismiss,
  onSubmit,
  error,
}) => {
  const { getFields } = useContentTypes();

  const [fieldOpen, setFieldOpen] = useState(false);

  const [selectedItems, setSelectedItems] = useState(null);
  const [search, setSearch] = useState('');

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
      setSearch('');
      getFields.execute();
    } else {
      setFieldOpen(false);
    }
  }, [isOpen]);

  const { groups, components } = useMemo(() => {
    if (!getFields?.result) {
      return {
        groups: [],
        components: [],
      };
    }
    const groups = [];

    const sortedComponents = (getFields?.result ?? [])
      .sort((a, b) => {
        const compare = a.group.localeCompare(b.group);
        if (!compare) return a.type.localeCompare(b.type);
        return compare;
      })
      .filter((cmp) => {
        if ((search ?? '').trim().length === 0) return true;
        if ((cmp.name ?? '').indexOf(search) > -1) return true;
        if ((cmp.type ?? '').indexOf(search) > -1) return true;
        return false;
      });

    sortedComponents.forEach((component, index) => {
      const group = groups.find((group) => group.key === component.group);
      if (!group) {
        groups.push({
          key: component.group,
          count: 1,
          index,
        });
      } else {
        group.count++;
        if (index < group.index) {
          group.index = index;
        }
      }
    });

    return {
      groups: groups.map((group) => ({
        count: group.count,
        key: group.key,
        name: group.key,
        startIndex: group.index,
      })),
      components: sortedComponents.map((cmp) => ({
        ...cmp,
        key: cmp.type,
      })),
    };
  }, [getFields?.result, search]);

  const Footer = useCallback(
    () => (
      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <PrimaryButton
          disabled={!(selectedItems?.length > 0)}
          onClick={() => {
            setFieldOpen(true);
          }}
          data-cy="contentTypes-fieldsSelect-config"
        >
          Configure
        </PrimaryButton>
        <DefaultButton onClick={onDismiss} data-cy="contentTypes-fieldsSelect-cancel">Cancel</DefaultButton>
      </Stack>
    ),
    [isOpen, selectedItems]
  );

  const columns = useMemo<IColumn[]>(
    () => [
      {
        key: 'icon',
        name: '',
        minWidth: 25,
        maxWidth: 25,
        onRender: ({ iconProps }) => (
          <div
            className={styles.iconCell}
            style={{
              height: 20,
              width: 20,
              fontSize: 12,
              backgroundColor: theme.palette.neutralLight,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Icon {...iconProps} />
          </div>
        ),
      },
      {
        key: 'name',
        name: 'Name',
        fieldName: 'name',
        minWidth: 100,
        maxWidth: 180,
        isPadded: true,
      },
      {
        key: 'description',
        name: 'Description',
        fieldName: 'description',
        minWidth: 100,
        data: 'string',
        isPadded: true,
      },
    ],
    []
  );

  const handleSubmit = (e) => {
    onSubmit(e);
  };

  return (
    <Panel
      isOpen={isOpen}
      headerText="Select field"
      isFooterAtBottom
      onRenderFooterContent={Footer}
      onDismiss={onDismiss}
      type={PanelType.medium}
      data-cy="contentTypes-fieldsSelect"
    >
      <SearchBox
        disabled={getFields.loading}
        placeholder="Search components..."
        onChange={(_event, newValue) => setSearch(newValue)}
      />
      <ShimmeredDetailsList
        setKey="items"
        groups={groups}
        items={components}
        columns={columns}
        selectionMode={SelectionMode.single}
        selection={selection}
        enableShimmer={getFields.loading}
        ariaLabelForShimmer="Content is being fetched"
        ariaLabelForGrid="Item details"
      />

      <FieldsConfigurePanel
        isOpen={fieldOpen}
        type={(selectedItems ?? [])?.[0]?.type}
        onDismiss={() => setFieldOpen(false)}
        onSubmit={handleSubmit}
        component={selectedItems?.[0]?.id}
        error={error}
      />
    </Panel>
  );
};

export default composeWrappers({
  contentTypesContext: ContentTypesContextProvider,
})(FieldsSelectPanel);
