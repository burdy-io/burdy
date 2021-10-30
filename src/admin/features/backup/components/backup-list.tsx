import {IColumn, MarqueeSelection, ShimmeredDetailsList} from "@fluentui/react";
import {IUser} from "@shared/interfaces/model";
import React, {useEffect, useMemo} from "react";
import {useBackups} from "@admin/features/backup/context/backup.context";


const BackupList = () => {
  const {selection, backups, list} = useBackups();

  useEffect(() => {
    list.execute();
  }, []);

  const columns = useMemo<IColumn[]>(() => ([
    {
      key: 'id',
      name: 'ID',
      fieldName: 'id',
      minWidth: 60,
      maxWidth: 60
    },
    {
      key: 'name',
      name: 'Name',
      fieldName: 'name',
      minWidth: 120,
    },
    {
      key: 'state',
      name: 'State',
      fieldName: 'state',
      minWidth: 200,
    },
    {
      key: 'createdAt',
      name: 'Created At',
      fieldName: 'createdAt',
      minWidth: 200,
    }
  ]), []);

  return (
    <div>
      <MarqueeSelection
        selection={selection as any}
        isDraggingConstrainedToRoot
      >
        <ShimmeredDetailsList
          enableShimmer={list?.loading}
          selection={selection as any}
          selectionMode={selection.mode}
          setKey="multiple"
          selectionPreservedOnEmptyClick
          items={backups ?? []}
          columns={columns}
        />
      </MarqueeSelection>
    </div>
  );
}

export default BackupList;
