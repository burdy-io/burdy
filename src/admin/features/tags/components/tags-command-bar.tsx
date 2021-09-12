import {
  CommandBar,
  ICommandBarItemProps,
  NeutralColors,
  SearchBox,
} from '@fluentui/react';
import React, { useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useTags } from '../context/tags.context';
import { useAuth } from '@admin/features/authentication/context/auth.context';

interface ITagsCommandBarProps {}
const TagsCommandBar: React.FC<ITagsCommandBarProps> = () => {
  const {
    selectedTags,
    getTags,
    params,
    setParams,

    stateData,
    setStateData,
  } = useTags();
  const { filterPermissions } = useAuth();
  const debounced = useDebouncedCallback(async (val) => {
    setParams({
      search: val,
    });
    getTags.execute({
      search: val,
    });
  }, 500);

  const commandItems = useMemo<ICommandBarItemProps[]>(
    () =>
      filterPermissions([
        {
          key: 'newItem',
          text: 'New',
          'data-cy': 'tags-commandBar-new',
          iconProps: { iconName: 'Add' },
          permissions: ['tags_create'],
          onClick: () => {
            setStateData('createTagOpen', true);
          },
        },
        {
          key: 'update',
          text: 'Update',
          'data-cy': 'tags-commandBar-update',
          disabled: selectedTags?.length !== 1,
          iconProps: { iconName: 'Edit' },
          permissions: ['tags_update'],
          onClick: () => {
            setStateData('updateTagOpen', true);
          },
        },
        {
          key: 'delete',
          text: 'Delete',
          'data-cy': 'tags-commandBar-delete',
          disabled: selectedTags?.length === 0,
          iconProps: { iconName: 'Delete' },
          permissions: ['tags_delete'],
          onClick: () => {
            setStateData('deleteTagsOpen', true);
          },
        },
        {
          key: 'refresh',
          text: 'Refresh',
          'data-cy': 'tags-commandBar-refresh',
          iconProps: { iconName: 'Refresh' },
          onClick: () => {
            getTags.execute(params);
          },
        },
      ]),
    [selectedTags, params, stateData]
  );

  const farToolbarItems = useMemo<ICommandBarItemProps[]>(
    () => [
      {
        key: 'search',
        onRenderIcon: () => (
          <SearchBox
            placeholder="Search tags..."
            onChange={(event, newValue) => {
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
      style={{ borderBottom: `1px solid ${NeutralColors.gray30}` }}
      farItems={farToolbarItems}
    />
  );
};

export default TagsCommandBar;
