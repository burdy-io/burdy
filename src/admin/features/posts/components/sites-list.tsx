import React, { useMemo } from 'react';
import {
  DetailsListLayoutMode,
  IColumn,
  Icon,
  MarqueeSelection,
  mergeStyleSets,
  SelectionMode,
  ShimmeredDetailsList,
  Stack,
} from '@fluentui/react';
import Empty from '@admin/components/empty';
import { useHistory } from 'react-router';
import { usePosts } from '../context/posts.context';

const classNames = mergeStyleSets({
  fileIconHeaderIcon: {
    padding: 0,
    fontSize: '16px',
  },
  fileIconCell: {
    textAlign: 'center',
    selectors: {
      '&:before': {
        content: '.',
        display: 'inline-block',
        verticalAlign: 'middle',
        height: '100%',
        width: '0px',
        visibility: 'hidden',
      },
    },
  },
  link: {
    '&:hover': {
      textDecoration: 'underline !important',
      cursor: 'pointer',
    },
  },
});

const SitesList = () => {
  const { getPosts, selection, params } = usePosts();
  const history = useHistory();

  const columns = useMemo<IColumn[]>(
    () => [
      {
        key: 'icon',
        name: '',
        fieldName: 'icon',
        minWidth: 30,
        isRowHeader: true,
        onRender: (item) => {
          let iconName;
          switch (item?.type) {
            case 'folder':
              iconName = 'FolderHorizontal';
              break;
            case 'fragment':
              iconName = 'WebAppBuilderFragment';
              break;
            case 'post_container':
              iconName = 'ArrangeBringToFront';
              break;
            case 'page':
              iconName = 'Page';
              break;
            default:
              iconName = 'PostUpdate';
              break;
          }
          return (
            <Stack style={{ height: '100%' }} verticalAlign="center">
              <Icon iconName={iconName} />
            </Stack>
          );
        },
      },
      {
        key: 'name',
        name: 'Name',
        fieldName: 'name',
        minWidth: 210,
        isResizable: true,
        isRowHeader: true,
        data: 'string',
        onRender: (item) => {
          return (
            <span
              className={classNames.link}
              onClick={() => {
                history.push(`/sites/editor/${item.id}`);
              }}
            >
              {item.name}
            </span>
          );
        },
        isPadded: true,
      },
      {
        key: 'key',
        name: 'Key',
        fieldName: 'key',
        minWidth: 210,
        isResizable: true,
        isRowHeader: true,
        data: 'string',
        onRender: (item) => {
          return <span>{item.key}</span>;
        },
        isPadded: true,
      },
      {
        key: 'contentType',
        name: 'Content Type',
        fieldName: 'contentType',
        minWidth: 120,
        isResizable: true,
        data: 'string',
        onRender: ({ contentType }) => {
          return <span>{contentType?.name}</span>;
        },
        isPadded: true,
      },
      {
        key: 'status',
        name: 'Status',
        fieldName: 'status',
        minWidth: 100,
        maxWidth: 100,
        isResizable: true,
        data: 'string',
        onRender: ({ status }) => {
          return <span>{status}</span>;
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
          return (
            <span>
              {author?.firstName} {author?.lastName}
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
          items={getPosts?.result ?? []}
          columns={columns}
          enableShimmer={getPosts?.loading}
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
      {!getPosts?.loading &&
        (!getPosts?.result || getPosts?.result?.length === 0) &&
        (params?.search?.length > 0 ? (
          <Empty title="No items match search criteria" />
        ) : (
          <Empty title="No items" image="posts" />
        ))}
    </div>
  );
};

export default SitesList;
