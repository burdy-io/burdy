import { usePosts } from '@admin/features/posts/context/posts.context';
import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  PrimaryButton,
} from '@fluentui/react';
import { IPost } from '@shared/interfaces/model';
import React, { useEffect } from 'react';

interface IPostVersionsDeleteDialogProps {
  isOpen?: boolean;
  post?: IPost;
  onDismiss?: () => void;
  onDeleted?: (ids?: any[]) => void;
}

const PostVersionsDeleteDialog: React.FC<IPostVersionsDeleteDialogProps> = ({
  isOpen,
  post,
  onDismiss,
  onDeleted,
}) => {
  const { deleteVersions, selectedPosts } = usePosts();

  useEffect(() => {
    deleteVersions.reset();
  }, [isOpen]);

  useEffect(() => {
    if (deleteVersions?.result) {
      onDeleted(deleteVersions?.result);
    }
  }, [deleteVersions?.result]);

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: 'Delete?',
      }}
      modalProps={{
        styles: { main: { maxWidth: 450 } },
      }}
    >
      Are you sure you would like to delete selected version?
      <DialogFooter>
        <DefaultButton onClick={onDismiss} text="Cancel" />
        <PrimaryButton
          onClick={() => {
            deleteVersions.execute(
              post?.id || selectedPosts?.[0]?.parentId,
              post?.versionId
                ? [post?.versionId]
                : selectedPosts.map((post) => post.id)
            );
          }}
          text="Delete"
          disabled={deleteVersions?.loading}
        />
      </DialogFooter>
    </Dialog>
  );
};

export default PostVersionsDeleteDialog;
