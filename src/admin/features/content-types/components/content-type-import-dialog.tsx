import { ControlledCheckbox } from '@admin/components/rhf-components';
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
import { useForm } from 'react-hook-form';
import { useContentTypes } from '@admin/features/content-types/context/content-types.context';
import { useDropzone } from 'react-dropzone';
import { isTrue } from '@admin/helpers/utility';

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

export type IContentTypesImportDialogProps = {
  isOpen?: boolean;
  onDismiss?: () => void;
  onImported?: () => void;
};

const ContentTypesImportDialog: React.FC<IContentTypesImportDialogProps> = (
  props
) => {
  const { isOpen, onDismiss, onImported } = props;
  const styles = useStyles();

  const fileInput = useRef(null);
  const { importContentTypes } = useContentTypes();
  const { control, reset, handleSubmit } = useForm();

  const [file, setFile] = useState(null);

  const [drag, setDrag] = useState(false);

  const onDrop = async (acceptedFiles) => {
    setDrag(false);

    if (acceptedFiles?.[0]?.type !== 'application/json') return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      setFile({
        name: acceptedFiles?.[0]?.name,
        content: JSON.parse(text as string)
      });
    };
    reader.readAsText(acceptedFiles?.[0]);
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
    if (importContentTypes?.result) {
      onImported();
    }
  }, [importContentTypes?.result]);

  useEffect(() => {
    if (isOpen) {
      importContentTypes.reset();
      setFile(null);
      reset();
    }
  }, [isOpen]);

  const handleImportFile = async (event) => {
    const files = event?.target?.files as FileList;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      setFile({
        name: files?.[0]?.name,
        content: JSON.parse(text as string)
      });
    };
    reader.readAsText(files?.[0]);
  };

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={() => onDismiss && onDismiss()}
      dialogContentProps={{
        type: DialogType.normal,
        title: 'Import Content Types'
      }}
      modalProps={{
        styles: { main: { maxWidth: 450 } }
      }}
    >
      {importContentTypes?.error && (
        <MessageBar
          messageBarType={MessageBarType.error}
          isMultiline={false}
          onDismiss={() => importContentTypes.reset()}
          dismissButtonAriaLabel='Close'
        >
          Name already exist
        </MessageBar>
      )}

      <form>
        <Stack tokens={{ childrenGap: 10 }}>
          <input
            hidden
            type='file'
            accept='application/json'
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
          {file && (
            <ControlledCheckbox
              name='force'
              label='Force (it will update content type if exists)'
              control={control}
            />
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
          />
          <PrimaryButton
            data-cy='content-types-import-submit'
            onClick={() => {
              handleSubmit((data) => {
                importContentTypes.execute({
                  data: file?.content,
                  force: isTrue(data?.force)
                });
              })();
            }}
            type='submit'
            text='Import'
            disabled={importContentTypes?.loading || !file}
          />
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export default ContentTypesImportDialog;
