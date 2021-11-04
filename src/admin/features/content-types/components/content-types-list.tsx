import React, { useMemo } from 'react';
import {
  DetailsListLayoutMode,
  IColumn,
  MarqueeSelection,
  mergeStyleSets,
  SelectionMode,
  ShimmeredDetailsList
} from '@fluentui/react';
import Empty from '@admin/components/empty';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import { useContentTypes } from '../context/content-types.context';

const classNames = mergeStyleSets({
  fileIconHeaderIcon: {
    padding: 0,
    fontSize: '16px'
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
        visibility: 'hidden'
      }
    }
  },
  link: {
    '&:hover': {
      textDecoration: 'underline !important',
      cursor: 'pointer'
    }
  }
});

const ContentTypesList = () => {
  const { getContentTypes, selection, setStateData, stateData, contentTypes } =
    useContentTypes();

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
          return hasPermission(['content_types_update']) ? (
            <span
              onClick={() => {
                setStateData('updateContentTypeOpen', true);
              }}
              className={classNames.link}
            >
              {item.name}
            </span>
          ) : (
            <span>{item.name}</span>
          );
        },
        isPadded: true
      },
      {
        key: 'type',
        name: 'Type',
        fieldName: 'type',
        minWidth: 210,
        isRowHeader: true,
        isResizable: true,
        data: 'string',
        onRender: ({ type }) => {
          return <span>{type}</span>;
        },
        isPadded: true
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
                hour12: false
              })}
            </span>
          );
        },
        isPadded: true
      }
    ],
    [stateData]
  );

  return (
    <div>
      <MarqueeSelection
        selection={selection as any}
        isDraggingConstrainedToRoot
      >
        <ShimmeredDetailsList
          items={contentTypes ?? []}
          columns={columns}
          enableShimmer={getContentTypes?.loading}
          selectionMode={SelectionMode.multiple}
          setKey='multiple'
          layoutMode={DetailsListLayoutMode.justified}
          isHeaderVisible
          selection={selection as any}
          selectionPreservedOnEmptyClick
          ariaLabelForSelectionColumn='Toggle selection'
          ariaLabelForSelectAllCheckbox='Toggle selection for all items'
          checkButtonAriaLabel='select row'
        />
      </MarqueeSelection>
      {!getContentTypes?.loading && !(contentTypes?.length > 0) && (
        <Empty title='No content types' image='contentTypes' />
      )}
    </div>
  );
};

export default ContentTypesList;
