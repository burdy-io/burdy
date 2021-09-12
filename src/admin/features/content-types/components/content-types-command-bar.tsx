import {
  CommandBar,
  ICommandBarItemProps,
  NeutralColors,
  SearchBox,
} from '@fluentui/react';
import React, { useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useContentTypes } from '../context/content-types.context';
import { useAuth } from '@admin/features/authentication/context/auth.context';

const ContentTypesCommandBar = () => {
  const {
    selectedContentTypes,

    stateData,
    setStateData,

    getContentTypes,
    params,
    setParams,
  } = useContentTypes();

  const { filterPermissions } = useAuth();

  const debounced = useDebouncedCallback(async (val) => {
    setParams({
      ...(params || {}),
      search: val,
    });

    getContentTypes.execute({
      ...(params || {}),
      search: val,
    });
  }, 500);

  const commandItems = useMemo<ICommandBarItemProps[]>(
    () =>
      filterPermissions([
        {
          key: 'newItem',
          text: 'New',
          'data-cy': 'contentTypes-commandBar-new',
          iconProps: { iconName: 'Add' },
          permissions: ['content_types_create'],
          onClick: () => {
            setStateData('createContentTypeOpen', true);
          },
        },
        {
          key: 'edit',
          text: 'Edit',
          'data-cy': 'contentTypes-commandBar-edit',
          disabled: selectedContentTypes?.length !== 1,
          iconProps: { iconName: 'Edit' },
          permissions: ['content_types_update'],
          onClick: () => {
            setStateData('updateContentTypeOpen', true);
          },
        },
        {
          key: 'delete',
          text: 'Delete',
          'data-cy': 'contentTypes-commandBar-delete',
          disabled: selectedContentTypes?.length === 0,
          iconProps: { iconName: 'Delete' },
          permissions: ['content_types_delete'],
          onClick: () => {
            setStateData('deleteContentTypesOpen', true);
          },
        },
        {
          key: 'refresh',
          text: 'Refresh',
          iconProps: { iconName: 'Refresh' },
          onClick: () => {
            getContentTypes.execute(params);
          },
        },
      ]),
    [selectedContentTypes, params, stateData]
  );

  const farToolbarItems = useMemo<ICommandBarItemProps[]>(
    () => [
      {
        key: 'search',
        onRenderIcon: () => (
          <SearchBox
            placeholder="Search types..."
            onChange={(_event, newValue) => {
              debounced(newValue);
            }}
          />
        ),
      },
    ],
    []
  );

  return (
    <CommandBar
      items={commandItems}
      farItems={farToolbarItems}
      style={{ borderBottom: `1px solid ${NeutralColors.gray30}` }}
    />
  );
};

export default ContentTypesCommandBar;
