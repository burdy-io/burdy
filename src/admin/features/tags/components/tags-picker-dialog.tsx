import {
  CommandBar,
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  ICommandBarItemProps,
  NeutralColors,
  PrimaryButton,
  SearchBox,
} from '@fluentui/react';
import React, { useEffect, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import { useTags, withTagsContext } from '../context/tags.context';
import TagCreateDialog from './tag-create-dialog';
import TagsColumns from './tags-columns';
import TagsList from './tags-list';

interface ITagsPickerDialog {
  isOpen?: boolean;
  disableNamespace?: boolean;
  onDismiss?: () => void;
  onSelected?: (data?: any) => void;
}

const TagsPickerDialog: React.FC<ITagsPickerDialog> = ({
  isOpen,
  onDismiss,
  onSelected,
  disableNamespace,
}) => {
  const {
    getTags,
    tagsState,
    selectedTags,
    params,
    setParams,
    stateData,
    setStateData,
  } = useTags();

  const { filterPermissions } = useAuth();

  useEffect(() => {
    tagsState.setArrayState([]);
    getTags.reset();
    if (isOpen) {
      getTags.execute();
    }
  }, [isOpen]);

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
          iconProps: { iconName: 'Add' },
          permissions: ['tags_create'],
          onClick: () => {
            setStateData('createTagOpen', true);
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
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: 'Select tags',
      }}
      maxWidth="90vw"
    >
      <div
        style={{
          height: 400,
          maxHeight: '80vh',
          width: 800,
          maxWidth: '80vw',
          overflow: 'auto',
        }}
      >
        <CommandBar
          items={commandItems}
          style={{ borderBottom: `1px solid ${NeutralColors.gray30}` }}
          farItems={farToolbarItems}
        />
        <div style={{ height: 'calc(100% - 45px)' }}>
          {!params?.search?.length && <TagsColumns />}
          {params?.search?.length > 0 && <TagsList />}
        </div>
      </div>
      <TagCreateDialog
        isOpen={stateData?.createTagOpen}
        onCreated={(tag) => {
          setStateData('createTagOpen', false);
          tagsState.create([tag]);
        }}
        onDismiss={() => setStateData('createTagOpen', false)}
      />
      <DialogFooter>
        <DefaultButton onClick={onDismiss} text="Cancel" />
        <PrimaryButton
          onClick={() => {
            if (onSelected) {
              onSelected(selectedTags);
            }
          }}
          text="Select"
          disabled={
            getTags?.loading ||
            (disableNamespace && selectedTags?.some((tag) => !tag.parentId))
          }
        />
      </DialogFooter>
    </Dialog>
  );
};

export default withTagsContext(TagsPickerDialog);
