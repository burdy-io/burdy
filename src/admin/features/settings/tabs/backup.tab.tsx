import React from 'react';
import Heading from '@admin/components/heading';
import {composeWrappers} from "@admin/helpers/hoc";
import {BackupContextProvider, useBackups} from "@admin/features/backup/context/backup.context";
import BackupCommandBar from "@admin/features/backup/components/backup-command-bar";
import BackupList from "@admin/features/backup/components/backup-list";

const BackupSettings = () => {
  const {create} = useBackups();

  return (
    <div>
      <Heading title="Backups" noPadding>
        Create and manage backups.
      </Heading>
      <BackupCommandBar />
      <BackupList />
    </div>
  );
};

export default composeWrappers({
  backupContext: BackupContextProvider,
})(BackupSettings);
