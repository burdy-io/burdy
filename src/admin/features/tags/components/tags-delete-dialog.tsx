import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  PrimaryButton,
} from '@fluentui/react';
import React, { useEffect } from 'react';
import { useTags } from '../context/tags.context';

interface ITagsDeleteDialogProps {
  isOpen?: boolean;
  onDismiss?: () => void;
  onDeleted?: (ids?: number[] | string[]) => void;
}

const TagsDeleteDialog: React.FC<ITagsDeleteDialogProps> = ({
  isOpen,
  onDismiss,
  onDeleted,
}) => {
  const { deleteTags, selectedTags } = useTags();

  useEffect(() => {
    deleteTags.reset();
  }, [isOpen]);

  useEffect(() => {
    if (deleteTags?.result) {
      onDeleted(deleteTags?.result);
    }
  }, [deleteTags?.result]);

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
      Are you sure you would like to delete selected tags?
      <DialogFooter>
        <DefaultButton data-cy="dialog-cancel" onClick={onDismiss} text="Cancel" />
        <PrimaryButton
          onClick={() => {
            deleteTags.execute(selectedTags.map((tag) => tag.id));
          }}
          text="Delete"
          data-cy="dialog-confirm"
          disabled={deleteTags?.loading}
        />
      </DialogFooter>
    </Dialog>
  );
};

export default TagsDeleteDialog;
