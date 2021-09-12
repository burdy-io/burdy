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

interface IPostVersionsRestoreDialogProps {
  isOpen?: boolean;
  post?: IPost;
  onDismiss?: () => void;
  onRestored?: () => void;
}

const PostVersionsRestoreDialog: React.FC<IPostVersionsRestoreDialogProps> = ({
  isOpen,
  post,
  onDismiss,
  onRestored,
}) => {
  const { restoreVersion, selectedPosts } = usePosts();

  useEffect(() => {
    restoreVersion.reset();
  }, [isOpen]);

  useEffect(() => {
    if (restoreVersion?.result) {
      onRestored();
    }
  }, [restoreVersion?.result]);

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: 'Restore?',
      }}
      modalProps={{
        styles: { main: { maxWidth: 450 } },
      }}
    >
      Are you sure you would like to restore selected version?
      <DialogFooter>
        <DefaultButton onClick={onDismiss} text="Cancel" />
        <PrimaryButton
          onClick={() => {
            restoreVersion.execute(
              post?.id || selectedPosts?.[0]?.parentId,
              post?.versionId || selectedPosts?.[0]?.id
            );
          }}
          text="Restore"
          disabled={restoreVersion?.loading}
        />
      </DialogFooter>
    </Dialog>
  );
};

export default PostVersionsRestoreDialog;
