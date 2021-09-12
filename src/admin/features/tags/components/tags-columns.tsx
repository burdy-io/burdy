import ColumnsView from '@admin/components/columns';
import React from 'react';
import { useTags } from '../context/tags.context';

interface ITagsColumnsProps {
  selectedTags?: number[];
}
const TagsColumns: React.FC<ITagsColumnsProps> = ({ selectedTags }) => {
  const { getTags, tags, selection } = useTags();
  return (
    <ColumnsView
      defaultSelected={selectedTags}
      loading={getTags?.loading}
      selection={selection}
      sort={(a, b) => {
        if (!a?.updatedAt || !b?.updatedAt) return 0;
        return (new Date(b.updatedAt)).getTime() - (new Date(a.updatedAt)).getTime();
      }}
      items={(tags || []).map((item) => ({
        ...item,
        title: item?.name,
        helper: item?.slug,
        key: item.id,
        iconProps: {
          iconName: 'Tag',
        },
      }))}
    />
  );
};

export default TagsColumns;
