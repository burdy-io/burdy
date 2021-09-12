import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  PrimaryButton,
} from '@fluentui/react';
import React, { useEffect } from 'react';
import { useAssets } from '../context/assets.context';

const AssetsDeleteDialog = () => {
  const { del, selectedAssets, stateData, setStateData } = useAssets();

  useEffect(() => {
    del.reset();
  }, [stateData?.deleteAssetsOpen]);

  useEffect(() => {
    if (del?.result) {
      setStateData('deleteAssetsOpen', false);
    }
  }, [del?.result]);

  return (
    <Dialog
      hidden={!stateData?.deleteAssetsOpen}
      onDismiss={() => setStateData('deleteAssetsOpen', false)}
      dialogContentProps={{
        type: DialogType.close,
        title: 'Delete?',
      }}
      modalProps={{
        styles: { main: { maxWidth: 450 } },
      }}
    >
      Are you sure you would like to send this item(s) to the recycle bin?
      <DialogFooter>
        <DefaultButton
          onClick={() => setStateData('deleteAssetsOpen', false)}
          text="Cancel"
        />
        <PrimaryButton
          onClick={() => {
            del.execute(selectedAssets.map((asset) => asset.id));
          }}
          text="Delete"
          data-cy="assets-deleteConfirm"
          disabled={del?.loading}
        />
      </DialogFooter>
    </Dialog>
  );
};

export default AssetsDeleteDialog;
