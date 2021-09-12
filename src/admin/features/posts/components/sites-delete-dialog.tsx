import { usePosts } from '@admin/features/posts/context/posts.context';
import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  PrimaryButton,
} from '@fluentui/react';
import React, { useEffect } from 'react';

interface ISitesDeleteDialogProps {
  isOpen?: boolean;
  onDismiss?: () => void;
  onDeleted?: () => void;
}

const SitesDeleteDialog: React.FC<ISitesDeleteDialogProps> = ({
  isOpen,
  onDismiss,
  onDeleted,
}) => {
  const { deletePosts, selectedPosts } = usePosts();

  useEffect(() => {
    deletePosts.reset();
  }, [isOpen]);

  useEffect(() => {
    if (deletePosts?.result) {
      onDeleted();
    }
  }, [deletePosts?.result]);

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
      Are you sure you would like to delete selected items(s)?
      <DialogFooter>
        <DefaultButton onClick={onDismiss} text="Cancel" />
        <PrimaryButton
          onClick={() => {
            deletePosts.execute(selectedPosts.map((post) => post.id));
          }}
          text="Delete"
          disabled={deletePosts?.loading}
        />
      </DialogFooter>
    </Dialog>
  );
};

export default SitesDeleteDialog;
