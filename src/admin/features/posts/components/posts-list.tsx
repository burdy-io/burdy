import React, { useMemo } from 'react';
import {
  DetailsListLayoutMode,
  IColumn,
  MarqueeSelection,
  mergeStyleSets,
  SelectionMode,
  ShimmeredDetailsList,
} from '@fluentui/react';
import Empty from '@admin/components/empty';
import { useHistory } from 'react-router';
import { usePosts } from '../context/posts.context';
import { useAuth } from '@admin/features/authentication/context/auth.context';

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

const PostsList = () => {
  const history = useHistory();
  const { getPosts, posts, selection, getOneContentType, params, additionalData } = usePosts();
  const { hasPermission } = useAuth();

  const columns = useMemo<IColumn[]>(
    () => [
      {
        key: 'name',
        name: 'Name',
        fieldName: 'name',
        minWidth: 210,
        isRowHeader: true,
        isResizable: true,
        data: 'string',
        onRender: (item) => {
          return hasPermission(['posts_update']) ? (
            <span
              className={classNames.link}
              onClick={() => {
                if (additionalData?.parentId) {
                  history.push(`/sites/editor/${item.id}`);
                } else {
                  history.push(
                    `/posts/${getOneContentType?.result?.id}/editor/${item.id}`
                  );
                }
              }}
            >
              {item.name}
            </span>
          ) : (
            <span>{item.name}</span>
          );
        },
        isPadded: true,
      },
      {
        key: 'slug',
        name: 'Slug',
        fieldName: 'slug',
        minWidth: 210,
        isRowHeader: true,
        isResizable: true,
        data: 'string',
        onRender: (item) => {
          return <span>{item.slug}</span>;
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
        }
      },
      {
        key: 'modifiedAt',
        name: 'Date Modified',
        fieldName: 'modifiedAt',
        minWidth: 200,
        maxWidth: 200,
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
    [getOneContentType?.result]
  );

  return (
    <div>
      <MarqueeSelection
        selection={selection as any}
        isDraggingConstrainedToRoot
      >
        <ShimmeredDetailsList
          items={posts ?? []}
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
        (!posts || posts.length === 0) &&
        (params?.search?.length > 0 ? (
          <Empty title="No posts match search criteria" />
        ) : (
          <Empty title="No posts" image="posts" />
        ))}
    </div>
  );
};

export default PostsList;
