import {
  cssColor,
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  IconButton,
  makeStyles,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Stack
} from '@fluentui/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useBackups } from '@admin/features/backup/context/backup.context';
import { useSnackbar } from '@admin/context/snackbar';

const useStyles = makeStyles((theme) => {
  const primary = cssColor(theme.palette.themePrimary);
  return {
    zone: {
      position: 'relative',
      padding: '2rem',
      height: 100,
      border: `1px solid ${theme.palette.themeLight}`,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center'
    },
    zoneDrag: {
      position: 'absolute',
      zIndex: 999,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 0,
      background: `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.04)`,
      border: `2px dashed ${theme.palette.themePrimary}`,
      color: theme.palette.white,
      pointerEvents: 'none'
    }
  };
});

const accept = 'zip,application/octet-stream,application/zip,application/x-zip,application/x-zip-compressed';

export type IBackupImportDialogProps = {
  isOpen?: boolean;
  onDismiss?: () => void;
};

const BackupImportDialog: React.FC<IBackupImportDialogProps> = (
  props
) => {
  const { isOpen, onDismiss } = props;
  const styles = useStyles();
  const snackbar = useSnackbar();

  const fileInput = useRef(null);
  const { upload } = useBackups();

  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);

  const onDrop = async (acceptedFiles) => {
    setDrag(false);
    if (accept.split(',').indexOf(acceptedFiles?.[0]?.type) === -1) return;
    setFile(acceptedFiles?.[0]);
  };

  const onDragEnter = useCallback(() => {
    setDrag(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDrag(false);
  }, []);

  const dropzone = useDropzone({
    noDragEventsBubbling: true,
    onDragEnter,
    onDragLeave,
    onDrop
  });

  useEffect(() => {
    if (upload?.result) {
      snackbar.openSnackbar({
        duration: 1000,
        messageBarType: MessageBarType.success,
        message: 'Backup imported.'
      });
      onDismiss();
    }
  }, [upload?.result]);

  useEffect(() => {
    if (isOpen) {
      upload.reset();
      setFile(null);
    }
  }, [isOpen]);

  const handleImportFile = async (event) => {
    const files = event?.target?.files as FileList;
    setFile(files?.[0]);
  };

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={() => onDismiss && onDismiss()}
      dialogContentProps={{
        type: DialogType.normal,
        title: 'Import Backup'
      }}
      modalProps={{
        styles: { main: { maxWidth: 450 } }
      }}
    >
      {upload?.error && (
        <MessageBar
          messageBarType={MessageBarType.error}
          isMultiline={false}
          onDismiss={() => upload.reset()}
          dismissButtonAriaLabel='Close'
        >
          Upload failed
        </MessageBar>
      )}

      <form>
        <Stack tokens={{ childrenGap: 10 }}>
          <input
            hidden
            type='file'
            accept={accept}
            ref={fileInput}
            onChange={handleImportFile}
            onClick={(event) => {
              (event.target as any).value = null;
            }}
          />
          {file && (
            <div className='chip chip--actionable'>
              <div className='content'>{file?.name}</div>
              <IconButton
                onClick={() => setFile(null)}
                iconProps={{ iconName: 'Cancel' }}
              />
            </div>
          )}
          {!file && (
            <div
              {...dropzone.getRootProps()}
              className={styles.zone}
              data-name='dropzone'
              {...props}
            >
              {drag && <div className={styles.zoneDrag} />}
              <div
                onClick={() => {
                  fileInput.current?.click?.();
                }}
              >
                Drag and Drop file here or click to upload
              </div>
            </div>
          )}
        </Stack>

        <DialogFooter>
          <DefaultButton
            onClick={() => onDismiss && onDismiss()}
            text='Cancel'
            type='button'
          />
          <PrimaryButton
            data-cy='backups-import-submit'
            onClick={() => {
              return upload.execute({
                file
              });
            }}
            type='button'
            text='Import'
            disabled={upload?.loading || !file}
          />
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export default BackupImportDialog;
