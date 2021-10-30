import { CommandBar, ICommandBarItemProps, MessageBarType, NeutralColors } from '@fluentui/react';
import React, { useMemo, useState } from 'react';
import { useBackups } from '@admin/features/backup/context/backup.context';
import { useDialog } from '@admin/context/dialog';
import { useSnackbar } from '@admin/context/snackbar';
import BackupImportDialog from '@admin/features/backup/components/backup-import-dialog';


const BackupCommandBar = () => {
  const { list, selectedBackups, remove, create, download, restore } = useBackups();
  const dialog = useDialog();
  const snackbar = useSnackbar();

  const [openImport, setOpenImport] = useState(false);

  const toolbarItems = useMemo<ICommandBarItemProps[]>(() => ([
    {
      key: 'create-backup',
      text: 'Create Backup',
      iconProps: {
        iconName: 'Save'
      },
      onClick: () => {
        (async () => {
          try {
            await dialog.confirm(
              'Create backup',
              'Are you sure you would like to proceed?'
            );

            await create.execute({});

            snackbar.openSnackbar({
              duration: 4000,
              messageBarType: MessageBarType.success,
              message: 'Creating backup'
            });
          } catch (e) {
            snackbar.openSnackbar({
              duration: 4000,
              messageBarType: MessageBarType.error,
              message: 'Failed to create backup'
            });
          }
        })();
      }
    },
    {
      key: 'download',
      text: 'Download Backup',
      iconProps: {
        iconName: 'Download'
      },
      disabled: selectedBackups.length !== 1,
      onClick: () => {
        const selectedId = selectedBackups?.[0]?.id;
        if (!selectedId) return;

        download(selectedId);
      }
    },
    {
      key: 'delete',
      text: 'Delete',
      disabled:
        selectedBackups.length !== 1,
      onClick: () => {
        (async () => {
          try {
            const selectedId = selectedBackups?.[0]?.id;
            if (!selectedId) return;

            await dialog.confirm(
              'Delete Backup',
              'Are you sure you would like to proceed?'
            );

            await remove.execute(selectedId);
          } catch (e) {
            //
          }
        })();
      },
      iconProps: {
        iconName: 'Delete'
      }
    },
    {
      key: 'import',
      text: 'Import',
      onClick: () => {
        setOpenImport(true);
      },
      iconProps: {
        iconName: 'Import'
      }
    },
    {
      key: 'restore',
      text: 'Restore',
      iconProps: { iconName: 'SaveTemplate' },
      disabled: selectedBackups.length !== 1,
      onClick: () => {
        (async () => {
          try {
            const selectedId = selectedBackups?.[0]?.id;
            if (!selectedId) return;

            await dialog.confirm(
              'Restore',
              'Are you sure you would like to proceed?'
            );

            await restore.execute(selectedId);

            snackbar.openSnackbar({
              duration: 1000,
              messageBarType: MessageBarType.success,
              message: 'Successfully restored.'
            });
          } catch (e) {
            snackbar.openSnackbar({
              duration: 1000,
              messageBarType: MessageBarType.error,
              message: 'Failed to restore'
            });
          }
        })();
      }
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: () => {
        list.execute();
      }
    }
  ]), [selectedBackups]);

  return (
    <div>
      <CommandBar
        items={toolbarItems}
        style={{ borderBottom: `1px solid ${NeutralColors.gray30}` }}
      />
      <BackupImportDialog
        isOpen={openImport}
        onDismiss={() => setOpenImport(false)}
      />
    </div>
  );
};

export default BackupCommandBar;
