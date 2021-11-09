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
import {IContentType} from "@shared/interfaces/model";

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
  infoCell: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 15,
    height: '100%'
  }
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
  const [selectedItem, setSelectedItem] = useState<IContentType|null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      getFields.execute();
    } else {
      setSelectedItem(null);
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
        if ((search || '') === '') return true;

        return (
          ((cmp.name as string).toLowerCase() || '').includes(search.toLowerCase()) ||
          ((cmp.type as string).toLowerCase() || '').includes(search.toLowerCase())
        );
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
        <DefaultButton onClick={onDismiss} data-cy="contentTypes-fieldsSelect-cancel">Back</DefaultButton>
      </Stack>
    ),
    []
  );

  const columns = useMemo<IColumn[]>(
    () => [
      {
        key: 'icon',
        name: '',
        minWidth: 40,
        maxWidth: 40,
        onRender: ({ iconProps }) => (
          <div
            className={styles.iconCell}
            style={{
              height: 40,
              width: 40,
              fontSize: 16,
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
        onRender: ({name}) => (
          <div className={styles.infoCell}>{name}</div>
        )
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
        placeholder="Search components..."
        onChange={(_event, newValue) => setSearch(newValue)}
        autoFocus
      />
      <ShimmeredDetailsList
        setKey="items"
        groups={groups}
        items={components}
        columns={columns}
        selectionMode={SelectionMode.none}
        enableShimmer={getFields.loading}
        ariaLabelForShimmer="Content is being fetched"
        ariaLabelForGrid="Item details"
        onRenderRow={(props, defaultRender) => (
          <div onClick={() => setSelectedItem(props?.item)}>
            {defaultRender(props)}
          </div>
        )}
      />

      <FieldsConfigurePanel
        isOpen={Boolean(selectedItem)}
        type={selectedItem?.type}
        onDismiss={() => setSelectedItem(null)}
        onSubmit={handleSubmit}
        component={selectedItem?.id as any}
        error={error}
      />
    </Panel>
  );
}

export default composeWrappers({
  contentTypesContext: ContentTypesContextProvider,
})(FieldsSelectPanel);
