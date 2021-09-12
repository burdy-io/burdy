import React, { useCallback, useEffect, useMemo } from 'react';
import {
  CommandBar,
  DefaultButton,
  IColumn,
  ICommandBarItemProps,
  Panel,
  PanelType,
  PrimaryButton,
  SelectionMode,
  ShimmeredDetailsList,
  Stack,
} from '@fluentui/react';
import { composeWrappers } from '@admin/helpers/hoc';
import {
  PostsContextProvider,
  usePosts,
} from '@admin/features/posts/context/posts.context';
import { getMetaValue } from '@admin/helpers/utility';
import { IPost } from '@shared/interfaces/model';
import { useHistory } from 'react-router';
import PostVersionsRestoreDialog from './post-versions-restore-dialog';
import PostVersionsDeleteDialog from './post-versions-delete-dialog';

const PostVersionsCommandBar = () => {
  const { getPosts, selectedPosts, setStateData, stateData } = usePosts();

  const commandItems = useMemo<ICommandBarItemProps[]>(
    () => [
      {
        key: 'restore',
        text: 'Restore',
        disabled: selectedPosts?.length !== 1,
        iconProps: { iconName: 'Undo' },
        onClick: () => {
          setStateData('versionRestoreOpen', true);
        },
      },
      {
        key: 'delete',
        text: 'Delete',
        disabled: !(selectedPosts?.length > 0),
        iconProps: { iconName: 'Delete' },
        onClick: () => {
          setStateData('versionsDeleteOpen', true);
        },
      },
    ],
    [getPosts, getPosts, stateData]
  );

  return (
    <CommandBar
      items={commandItems}
      styles={{
        root: {
          padding: 0,
        },
      }}
    />
  );
};

interface PostVersionsSelectPanelProps {
  isOpen?: boolean;
  post?: IPost;
  selectionMode?: SelectionMode;
  error?: string;
  onDismiss?: () => void;
  onSelect?: (post?: IPost) => void;
  onUpdate?: () => void;
}

const PostVersionsSelectPanel: React.FC<PostVersionsSelectPanelProps> = ({
  isOpen,
  onDismiss,
  selectionMode,
  onSelect,
  onUpdate,
  post,
}) => {
  const { getVersions, selectedPosts, selection, stateData, setStateData } =
    usePosts();

  const history = useHistory();

  useEffect(() => {
    if (isOpen && post?.id) {
      getVersions.execute(post?.id);
    }
  }, [isOpen, post]);

  const Footer = useCallback(
    () => (
      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <PrimaryButton
          disabled={selectedPosts?.length !== 1}
          onClick={() => {
            onSelect(selectedPosts?.[0]);
          }}
        >
          Open
        </PrimaryButton>
        <DefaultButton onClick={onDismiss}>Cancel</DefaultButton>
      </Stack>
    ),
    [isOpen, post, selectedPosts]
  );

  const columns = useMemo<IColumn[]>(
    () => [
      {
        key: 'author',
        name: 'Author',
        fieldName: 'author',
        minWidth: 50,
        maxWidth: 100,
        onRender: ({ author }) => (
          <span>
            {author?.firstName} {author?.lastName}
          </span>
        ),
        isPadded: true,
      },
      {
        key: 'createdAt',
        name: 'Created At',
        onRender: ({ createdAt }) => <div>{createdAt}</div>,
        minWidth: 50,
        data: 'string',
        isPadded: true,
      },
    ],
    []
  );

  return (
    <Panel
      isOpen={isOpen}
      headerText="Select version"
      isFooterAtBottom
      onRenderFooterContent={Footer}
      onDismiss={onDismiss}
      type={PanelType.medium}
    >
      <PostVersionsCommandBar />
      <ShimmeredDetailsList
        setKey="items"
        items={getVersions?.result || []}
        columns={columns}
        selectionMode={selectionMode}
        selection={selection as any}
        enableShimmer={getVersions.loading}
        ariaLabelForShimmer="Versions are being fetched"
        ariaLabelForGrid="Item details"
      />
      <PostVersionsDeleteDialog
        isOpen={stateData?.versionsDeleteOpen}
        onDismiss={() => setStateData('versionsDeleteOpen', false)}
        onDeleted={() => {
          setStateData('versionsDeleteOpen', false);
          getVersions.execute(post?.id);
          if (onUpdate) {
            onUpdate();
          }
        }}
      />
      <PostVersionsRestoreDialog
        isOpen={stateData?.versionRestoreOpen}
        onDismiss={() => setStateData('versionRestoreOpen', false)}
        onRestored={() => {
          setStateData('versionRestoreOpen', false);
          history.push({
            search: 'action=version_restored',
          });
          window.location.reload();
        }}
      />
    </Panel>
  );
};

export default composeWrappers({
  postsContext: PostsContextProvider,
})(PostVersionsSelectPanel);
