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
import { IPost } from '@shared/interfaces/model';
import { useHistory, useLocation } from 'react-router';
import PostVersionsRestoreDialog from './post-versions-restore-dialog';
import PostVersionsDeleteDialog from './post-versions-delete-dialog';
import queryString from 'query-string';

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
  onDelete?: () => void;
}

const PostVersionsSelectPanel: React.FC<PostVersionsSelectPanelProps> = ({
  isOpen,
  onDismiss,
  selectionMode,
  onSelect,
  onUpdate,
  onDelete,
  post,
}) => {
  const { getVersions, selectedPosts, selection, stateData, setStateData } =
    usePosts();

  const location = useLocation();
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
        onDeleted={(deleted) => {
          setStateData('versionsDeleteOpen', false);
          getVersions.execute(post?.id);
          onDelete();
          if ((deleted || []).indexOf(post?.versionId) > -1 && onUpdate) {
            history.push({
              search: queryString.stringify({
                ...(queryString.parse(location.search) || {}),
                versionId: undefined,
                action: 'version_deleted',
              }),
            });
            onDismiss();
          }
        }}
      />
      <PostVersionsRestoreDialog
        isOpen={stateData?.versionRestoreOpen}
        onDismiss={() => setStateData('versionRestoreOpen', false)}
        onRestored={() => {
          setStateData('versionRestoreOpen', false);
          history.push({
            search: queryString.stringify({
              ...(queryString.parse(location.search) || {}),
              action: 'version_restored',
            }),
          });
          if (onUpdate) {
            onUpdate();
          }
        }}
      />
    </Panel>
  );
};

export default composeWrappers({
  postsContext: PostsContextProvider,
})(PostVersionsSelectPanel);
