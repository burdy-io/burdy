import {CommandBar, ICommandBarItemProps, NeutralColors} from "@fluentui/react";
import React, {useEffect, useMemo} from "react";
import {useBackups} from "@admin/features/backup/context/backup.context";
import {useDialog} from "@admin/context/dialog";


const BackupCommandBar = () => {
  const {list, selectedBackups, remove, create, download} = useBackups();
  const dialog = useDialog();

  const toolbarItems = useMemo<ICommandBarItemProps[]>(() => ([
    {
      key: 'create-backup',
      text: 'Create Backup',
      iconProps: {
        iconName: 'Save'
      },
      onClick: () => {
        create.execute({});
      }
    },
    {
      key: 'download',
      text: 'Download Backup',
      iconProps: {
        iconName: 'Download',
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
        iconName: 'Delete',
      },
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: () => {
        list.execute();
      },
    }
  ]), [selectedBackups]);

  return (
    <CommandBar
      items={toolbarItems}
      style={{ borderBottom: `1px solid ${NeutralColors.gray30}` }}
    />
  )
}

export default BackupCommandBar;
