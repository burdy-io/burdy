import { useDropzone } from 'react-dropzone';
import React, { useCallback, useState } from 'react';
import { cssColor, makeStyles } from '@fluentui/react';
import { IAsset } from '@shared/interfaces/model';
import { useAssets } from '../context/assets.context';

const FOLDER_MIME_TYPE = 'application/vnd.burdy.folder';

const useStyles = makeStyles((theme) => {
  const primary = cssColor(theme.palette.themePrimary);

  return {
    zone: {
      position: 'absolute',
      zIndex: 999,
      inset: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 0,
      background: `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.04)`,
      border: `2px dashed ${theme.palette.themePrimary}`,
      color: theme.palette.white,
      pointerEvents: 'none',
    },
  };
});

interface IAssetsDropzoneProps extends React.HTMLProps<HTMLDivElement> {
  asset?: IAsset;
}

const AssetsDropzone: React.FC<IAssetsDropzoneProps> = ({
  asset,
  children,
  ...props
}) => {
  const styles = useStyles();
  const { upload, params, getAssets } = useAssets();
  const [drag, setDrag] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      setDrag(false);

      const files = acceptedFiles.map((file: File) => ({
        file,
        data: {
          mimeType: file.type,
          parentId: asset?.id ?? params?.parentId,
        },
      }));

      await upload.execute(files);
    },
    [params, getAssets, asset]
  );

  const onDragEnter = useCallback(() => {
    setDrag(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDrag(false);
  }, []);

  const isDropzone =
    asset?.mimeType === FOLDER_MIME_TYPE || asset === undefined;

  const dropzone = useDropzone({
    noDragEventsBubbling: true,
    onDragEnter,
    onDragLeave,
    onDrop,
  });

  if (!isDropzone) {
    return <>{children}</>;
  }

  return (
    <div
      {...dropzone.getRootProps()}
      style={{ height: '100%', position: 'relative' }}
      data-name="dropzone"
      {...props}
    >
      {drag && <div className={styles.zone} />}
      {children}
    </div>
  );
};

export default AssetsDropzone;
