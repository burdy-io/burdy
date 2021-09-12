import {
  ActionButton,
  IBasePicker,
  IBasePickerSuggestionsProps,
  ITag,
  Label,
  TagPicker,
} from '@fluentui/react';
import React, { useEffect, useState } from 'react';
import { Control, Controller } from 'react-hook-form';
import { useTags, withTagsContext } from '../context/tags.context';
import TagsPickerDialog from './tags-picker-dialog';

interface ITagsPickerControlProps {
  control: Control;
  label?: string;
  name?: string;
}

const pickerSuggestionsProps: IBasePickerSuggestionsProps = {
  suggestionsHeaderText: 'Suggested tags',
  noResultsFoundText: 'No color tags found',
};

const TagsPickerControl: React.FC<ITagsPickerControlProps> = ({
  control,
  label,
  name,
}) => {
  const picker = React.useRef<IBasePicker<ITag>>(null);

  const [tagsPickerOpened, setTagsPickerOpened] = useState(false);
  const { getTags, tags } = useTags();

  useEffect(() => {
    getTags.execute();
  }, []);

  const getTextFromItem = (item: any) => `${item?.name} (${item?.slug})`;

  const listContainsTagList = (tag: any) => {
    if (tags?.length > 0) {
      return tags?.some((compareTag) => compareTag.id === tag.id);
    }
    return false;
  };

  const notInCurrentValues = (tag: any, values: any[]) => {
    return !values.find((val) => val?.id == tag?.id);
  };

  const filterSelectedTags =
    (values: any[]) =>
    (filterText: string): any[] => {
      return filterText
        ? tags?.filter((tag) => {
            return (
              tag.parentId !== null &&
              notInCurrentValues(tag, values) &&
              (tag.name.toLowerCase().indexOf(filterText.toLowerCase()) > -1 ||
                tag.slug.toLowerCase().indexOf(filterText.toLowerCase()) > -1)
            );
          })
        : [];
    };

  const onItemSelected =
    (values) =>
    (item: ITag): ITag | null => {
      if (
        picker.current &&
        listContainsTagList(item) &&
        notInCurrentValues(item, values)
      ) {
        return item;
      }
      return null;
    };

  return (
    <>
      <Controller
        name={name}
        control={control}
        defaultValue={[]}
        render={({ field: { onChange, value } }) => (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Label>{label}</Label>
              <ActionButton
                text="Tag Selector"
                onClick={() => {
                  setTagsPickerOpened(true);
                }}
              />
            </div>
            <TagPicker
              styles={{
                root: {
                  marginTop: '0 !important',
                },
              }}
              onChange={(items) => {
                onChange(items);
              }}
              selectedItems={value}
              removeButtonAriaLabel="Remove"
              selectionAriaLabel="Selected tags"
              componentRef={picker}
              onResolveSuggestions={filterSelectedTags(value)}
              onItemSelected={onItemSelected(value)}
              getTextFromItem={getTextFromItem}
              pickerSuggestionsProps={pickerSuggestionsProps}
              disabled={false}
            />
            <TagsPickerDialog
              onDismiss={() => setTagsPickerOpened(false)}
              isOpen={tagsPickerOpened}
              disableNamespace
              onSelected={(data) => {
                const toAdd = (data || []).filter(
                  (item) => !(value || []).some((val) => val?.id == item?.id)
                );
                onChange([...(value || []), ...toAdd]);
                getTags.execute();
                setTagsPickerOpened(false);
              }}
            />
          </div>
        )}
      />
    </>
  );
};

export default withTagsContext(TagsPickerControl);
