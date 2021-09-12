import React, { useEffect, useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import {
  CommandBar,
  DetailsListLayoutMode,
  IColumn,
  ICommandBarItemProps,
  IconButton,
  Label,
  MarqueeSelection,
  mergeStyleSets,
  SelectionMode,
  ShimmeredDetailsList,
} from '@fluentui/react';
import { composeWrappers } from '@admin/helpers/hoc';
import {
  PostsContextProvider,
  usePosts,
} from '@admin/features/posts/context/posts.context';
import Empty from '@admin/components/empty';
import PostsSelectPanel from '@admin/features/posts/components/posts-select-panel';
import { IPost } from '@shared/interfaces/model';
import { useExtendedFormContext } from '@admin/config-fields/dynamic-form';

const styles = mergeStyleSets({
  postsWrapper: {
    minHeight: 240,
    overflow: 'auto',
  },
});

interface PostsListProps {
  posts: IPost[];
  onReorder?: (posts: any[]) => void;
}

const PostsList: React.FC<PostsListProps> = ({ posts, onReorder }) => {
  const { selection, getPosts } = usePosts();

  const [postsVal, setPostsVal] = useState([]);

  useEffect(() => {
    if (posts?.length > 0) {
      getPosts.execute({
        id: (posts || []).map((post) => post?.id).join(','),
      });
    } else {
      getPosts.reset();
    }
  }, [posts]);

  useEffect(() => {
    const result = [...(getPosts?.result || [])];
    result.sort((a, b) => {
      const aIndex = posts.findIndex((post) => post.id == a.id);
      const bIndex = posts.findIndex((post) => post.id == b.id);
      return aIndex - bIndex;
    });
    setPostsVal(result);
  }, [getPosts?.result]);

  const columns = useMemo<IColumn[]>(
    () => [
      {
        key: 'name',
        name: 'Name',
        fieldName: 'name',
        minWidth: 210,
        isRowHeader: true,
        data: 'string',
        onRender: (item) => {
          return <div>{item?.name}</div>;
        },
        isPadded: true,
      },
      {
        key: 'contentType',
        name: 'Content Type',
        fieldName: 'contentType',
        minWidth: 210,
        isResizable: true,
        data: 'string',
        onRender: ({ contentType }) => {
          return <div>{contentType?.name}</div>;
        },
        isPadded: true,
      },
      {
        key: 'action',
        name: '',
        fieldName: 'action',
        minWidth: 60,
        maxWidth: 60,
        onRender: ({ contentType, contentTypeId, id }) => (
          <IconButton
            iconProps={{
              iconName: 'OpenInNewTab',
            }}
            title="Open in new tab"
            onClick={() => {
              let url;
              if (contentType?.type === 'page') {
                url = `/admin/sites/editor/${id}`;
              } else {
                url = `/admin/posts/${contentTypeId}/editor/${id}`;
              }
              window.open(url, '_blank');
            }}
          />
        ),
      },
    ],
    []
  );

  if (
    !getPosts?.loading &&
    (!getPosts?.result || getPosts?.result?.length === 0)
  ) {
    return (
      <div className={styles.postsWrapper}>
        <Empty compact title="No relations" image="posts" />
      </div>
    );
  }

  return (
    <div className={styles.postsWrapper}>
      <MarqueeSelection
        selection={selection as any}
        isDraggingConstrainedToRoot
      >
        <ShimmeredDetailsList
          items={postsVal || []}
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
    </div>
  );
};

interface DynamicRelationProps {
  field: any;
  name?: string;
}

const DynamicRelation: React.FC<DynamicRelationProps> = ({ field, name }) => {
  const { control, disabled } = useExtendedFormContext();
  const { selectedPosts } = usePosts();

  const [addPostOpen, setAddPostOpen] = useState(false);

  const selectedItem = useMemo(() => {
    if (selectedPosts?.length === 1) {
      return selectedPosts?.[0];
    }
    return undefined;
  }, [selectedPosts]);
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={[]}
      render={({ field: { onChange, value: fieldValue } }) => {
        const value = useMemo(() => {
          let val = [];
          try {
            val = JSON.parse(fieldValue);
          } catch {
            //
          }
          return val;
        }, [fieldValue]);
        const selectedItemIndex = useMemo(() => {
          return (value || []).findIndex(
            (item) => item?.id == selectedItem?.id
          );
        }, [value, selectedItem]);

        const move = (offset) => {
          const items = [
            ...(value || []).filter((_val, i) => i !== selectedItemIndex),
          ];

          items.splice(selectedItemIndex + offset, 0, {
            id: selectedItem?.id,
          });

          onChange(JSON.stringify(items));
        };

        const commandItems = useMemo<ICommandBarItemProps[]>(
          () => [
            {
              key: 'addPost',
              text: 'Add',
              disabled: !!disabled,
              iconProps: { iconName: 'Add' },
              onClick: () => {
                setAddPostOpen(true);
              },
            },
            {
              key: 'remove',
              text: 'Remove',
              disabled: disabled || !selectedPosts?.length || selectedPosts?.length === 0,
              iconProps: { iconName: 'Delete' },
              onClick: () => {
                onChange(
                  JSON.stringify((value ?? []).filter((post) =>
                    selectedPosts.every((selected) => selected?.id != post.id)
                  ))
                );
              },
            },
            {
              key: 'moveUp',
              disabled: disabled || selectedPosts?.length !== 1 || selectedItemIndex === 0,
              iconProps: { iconName: 'Up' },
              onClick: () => {
                move(-1);
              },
            },
            {
              key: 'moveDown',
              disabled:
                disabled ||
                selectedPosts?.length !== 1 ||
                selectedItemIndex >= (value || []).length - 1,
              iconProps: { iconName: 'Down' },
              onClick: () => {
                move(1);
              },
            },
          ],
          [selectedPosts]
        );

        return (
          <>
            {field?.label?.length > 0 && <Label>{field?.label}</Label>}
            <CommandBar
              styles={{
                root: {
                  padding: 0,
                  marginBottom: 8,
                },
              }}
              items={commandItems}
            />

            <PostsList
              posts={value}
              onReorder={(data) => {
                onChange(
                  JSON.stringify((data || []).map((item) => ({
                    id: item?.id,
                  })))
                );
              }}
            />

            <PostsSelectPanel
              isOpen={addPostOpen}
              onDismiss={() => setAddPostOpen(false)}
              onSubmit={(data) => {
                onChange(JSON.stringify([
                  ...(Array.isArray(value) ? value : []).filter(
                    (val) => !!val?.id && !Number.isNaN(val?.id)
                  ),
                  ...data
                    .filter(
                      (post) => !(value || []).find((val) => val.id == post.id)
                    )
                    .map((post) => ({
                      id: post.id,
                    })),
                ]));
                setAddPostOpen(false);
              }}
              params={{
                contentTypeId: field.posts,
              }}
            />
          </>
        );
      }}
    />
  );
};

export default composeWrappers({
  postsContext: PostsContextProvider,
})(DynamicRelation);
