import React, { useMemo } from 'react';
import {
  DetailsListLayoutMode,
  IColumn,
  MarqueeSelection,
  SelectionMode,
  ShimmeredDetailsList,
} from '@fluentui/react';
import Empty from '@admin/components/empty';
import { useTags } from '../context/tags.context';

const TagsList = () => {
  const { getTags, tags, selection, params } = useTags();

  const columns = useMemo<IColumn[]>(
    () => [
      {
        key: 'name',
        name: 'Name',
        fieldName: 'name',
        minWidth: 210,
        isResizable: true,
        isRowHeader: true,
        data: 'string',
        onRender: (item) => {
          return <span>{item.name}</span>;
        },
        isPadded: true,
      },
      {
        key: 'path',
        name: 'Path',
        fieldName: 'path',
        minWidth: 210,
        isResizable: true,
        isRowHeader: true,
        data: 'string',
        onRender: (item) => {
          return <span>{item.slugPath}</span>;
        },
        isPadded: true,
      },
      {
        key: 'author',
        name: 'Author',
        fieldName: 'author',
        minWidth: 210,
        isResizable: true,
        isCollapsible: true,
        onRender: ({ author }) => {
          const obj: any = {};
          (author?.meta ?? []).forEach((meta) => {
            obj[meta?.key] = meta?.value;
          });
          return (
            <span>
              {obj?.firstName} {obj?.lastName}
            </span>
          );
        },
      },
      {
        key: 'modifiedAt',
        name: 'Date Modified',
        fieldName: 'modifiedAt',
        minWidth: 100,
        maxWidth: 100,
        isResizable: true,
        data: 'number',
        onRender: ({ updatedAt }) => {
          return (
            <span>
              {new Date(updatedAt).toLocaleDateString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </span>
          );
        },
        isPadded: true,
      },
    ],
    []
  );

  return (
    <div>
      <MarqueeSelection
        selection={selection as any}
        isDraggingConstrainedToRoot
      >
        <ShimmeredDetailsList
          items={tags || []}
          columns={columns}
          enableShimmer={getTags?.loading}
          selectionMode={SelectionMode.multiple}
          setKey="multiple"
          layoutMode={DetailsListLayoutMode.justified}
          isHeaderVisible
          selection={selection as any}
          selectionPreservedOnEmptyClick
          ariaLabelForSelectionColumn="Toggle selection"
          ariaLabelForSelectAllCheckbox="Toggle selection for all items"
          checkButtonAriaLabel="select row"
        />
      </MarqueeSelection>
      {!getTags?.loading &&
        (!tags || tags?.length === 0) &&
        (params?.search?.length > 0 ? (
          <Empty title="No tags match search criteria" />
        ) : (
          <Empty title="No tags" image="tags" />
        ))}
    </div>
  );
};

export default TagsList;
