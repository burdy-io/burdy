import React, { useCallback, useEffect, useMemo } from 'react';
import {
  DefaultButton,
  IColumn,
  Panel,
  PanelType,
  PrimaryButton,
  SearchBox,
  SelectionMode,
  ShimmeredDetailsList,
  Stack,
} from '@fluentui/react';
import { composeWrappers } from '@admin/helpers/hoc';
import {
  PostsContextProvider,
  usePosts,
} from '@admin/features/posts/context/posts.context';
import { useDebouncedCallback } from 'use-debounce';

interface IPostsSelectPanelProps {
  isOpen?: boolean;
  params?: any;
  selectionMode?: SelectionMode;
  error?: string;
  onDismiss?: () => void;
  onSubmit?: (e: any) => void;
}

const PostsSelectPanel: React.FC<IPostsSelectPanelProps> = ({
  isOpen,
  onDismiss,
  onSubmit,
  selectionMode,
  params,
}) => {
  const {
    getPosts,
    params: searchParams,
    setParams,
    selectedPosts,
    selection,
  } = usePosts();

  const debounced = useDebouncedCallback(async (val) => {
    setParams({
      ...(searchParams || {}),
      search: val,
    });

    getPosts.execute({
      ...(searchParams || {}),
      search: val,
    });
  }, 500);

  useEffect(() => {
    if (isOpen) {
      setParams(params);
      getPosts.execute(params);
    }
  }, [isOpen]);

  const Footer = useCallback(
    () => (
      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <PrimaryButton
          disabled={!(selectedPosts?.length > 0)}
          onClick={() => {
            onSubmit(selectedPosts);
          }}
        >
          Select
        </PrimaryButton>
        <DefaultButton onClick={onDismiss}>Cancel</DefaultButton>
      </Stack>
    ),
    [isOpen, selectedPosts]
  );

  const columns = useMemo<IColumn[]>(
    () => [
      {
        key: 'name',
        name: 'Name',
        fieldName: 'name',
        minWidth: 100,
        isPadded: true,
      },
      {
        key: 'slugPath',
        name: 'Path',
        fieldName: 'slugPath',
        minWidth: 200,
        isPadded: true,
      },
      {
        key: 'contentType',
        name: 'Content Type',
        onRender: ({ contentType }) => <div>{contentType?.name}</div>,
        minWidth: 100,
        data: 'string',
        isPadded: true,
      },
    ],
    []
  );

  return (
    <Panel
      isOpen={isOpen}
      headerText="Select posts"
      isFooterAtBottom
      onRenderFooterContent={Footer}
      onDismiss={onDismiss}
      type={PanelType.medium}
    >
      <SearchBox
        placeholder="Search posts..."
        onChange={(_event, newValue) => {
          debounced(newValue);
        }}
      />
      <ShimmeredDetailsList
        setKey="items"
        items={getPosts?.result || []}
        columns={columns}
        selectionMode={selectionMode}
        selection={selection as any}
        enableShimmer={getPosts.loading}
        ariaLabelForShimmer="Posts are being fetched"
        ariaLabelForGrid="Item details"
      />
    </Panel>
  );
};

export default composeWrappers({
  postsContext: PostsContextProvider,
})(PostsSelectPanel);
