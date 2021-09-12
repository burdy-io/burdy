import React from 'react';
import GroupList from '@admin/features/groups/components/group-list';
import GroupCommandBar from '@admin/features/groups/components/group-command-bar';
import Heading from '@admin/components/heading';
import GroupAdd from '@admin/features/groups/components/group-add';
import { PermissionsContextProvider } from '@admin/features/permissions/context/permissions.context';
import GroupEdit from '@admin/features/groups/components/group-edit';
import { Route } from 'react-router';
import { composeWrappers } from '@admin/helpers/hoc';
import { GroupsContextProvider } from '@admin/features/groups/context/groups.context';
import { makeStyles } from '@fluentui/react';

const useStyles = makeStyles({
  innerContainer: {
    marginTop: 24,
  },
});

const GroupSettings = () => {
  const styles = useStyles();

  return (
    <div>
      <Heading title="Groups">
        Manage your group settings. Protected groups are provided by the system
        and cannot be edited.
      </Heading>
      <div className={styles.innerContainer}>
        <GroupCommandBar />
        <GroupList />
        <PermissionsContextProvider>
          <Route path="/settings/groups/add" component={GroupAdd} />
          <Route path="/settings/groups/edit/:id" component={GroupEdit} />
        </PermissionsContextProvider>
      </div>
    </div>
  );
};

export default composeWrappers({
  groupsContext: GroupsContextProvider,
})(GroupSettings);
