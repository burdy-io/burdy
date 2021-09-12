import {
  CommandBar,
  ICommandBarItemProps,
  makeStyles,
  SearchBox,
} from '@fluentui/react';
import { IUser } from '@shared/interfaces/model';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  UsersContextProvider,
  useUsers,
} from '@admin/features/users/context/users.context';
import _ from 'lodash';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import { composeWrappers } from '@admin/helpers/hoc';
import UserSelectPanel from '@admin/features/users/components/user-select-panel';
import { useAsync, useConst } from '@fluentui/react-hooks';
import UserList from '@admin/features/users/components/user-list';
import { userMeta } from '@admin/helpers/misc';

const useStyles = makeStyles({
  commandBar: {
    marginTop: 12,
  },
});

interface GroupMembersProps {
  users: IUser[];
  setUsers?: (users: IUser[]) => void;
  close?: Function;
  isProtected?: boolean;
}

const GroupMembers: React.FC<GroupMembersProps> = ({
  users,
  setUsers,
  close,
  isProtected = false,
}) => {
  const styles = useStyles();
  const usersContext = useUsers();
  const { user: authUser } = useAuth();
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addUsers, setAddUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [addUserSearch, setAddUserSearch] = useState('');

  const debouncedSearch = useAsync().debounce((search: string) => {
    setUserSearch(search);
  }, 150);

  const debouncedAddSearch = useAsync().debounce((search: string) => {
    setAddUserSearch(search);
  }, 150);

  useEffect(() => {
    usersContext.list.execute();
  }, []);

  useEffect(() => {
    setAddUsers(_.differenceBy(usersContext.users, users, 'id'));
  }, [usersContext.users, users]);

  const searchUsers = useCallback((users: IUser[], search: string) => {
    const lowerCaseSearch = search.toLowerCase();
    return users.filter(
      (user) =>
        (user?.firstName || '').toLowerCase().includes(lowerCaseSearch) ||
        (user?.lastName || '').toLowerCase().includes(lowerCaseSearch) ||
        user.email.toLowerCase().includes(lowerCaseSearch)
    );
  }, []);

  const commandActions = useMemo<ICommandBarItemProps[]>(
    () => [
      {
        key: 'add',
        text: 'Add members',
        iconProps: { iconName: 'Add' },
        onClick: () => setAddUserOpen(true),
      },
      {
        key: 'remove',
        text: `Remove members`,
        iconProps: { iconName: 'Delete' },
        disabled:
          usersContext.selectedUsers.length === 0 ||
          (isProtected &&
            usersContext.selectedUsers.some((u) => u.id === authUser.id)),
        onClick: () => {
          setUsers(_.differenceBy(users, usersContext.selectedUsers, 'id'));
        },
      },
    ],
    [authUser, users, usersContext.selectedUsers]
  );

  const addUserCommandItems = useConst<ICommandBarItemProps[]>(() => [
    {
      key: 'search',
      onRenderIcon: () => (
        <SearchBox
          placeholder="Search users..."
          onChange={(event, newValue) => debouncedAddSearch(newValue)}
        />
      ),
    },
  ]);

  const visibleUsers = useMemo(
    () => searchUsers(users, userSearch),
    [users, userSearch]
  );
  const visibleAddUsers = useMemo(
    () => searchUsers(addUsers, addUserSearch),
    [addUsers, addUserSearch]
  );

  return (
    <>
      <UserSelectPanel
        suppressDefaultUpdates
        panelProps={{ title: 'Add Members' }}
        isOpen={addUserOpen}
        onBack={() => setAddUserOpen(false)}
        onDismiss={() => close?.()}
        onSubmit={(selectedUsers) => {
          setUsers(
            _.sortedUniqBy(_.sortBy([...users, ...selectedUsers], 'id'), 'id')
          );
          setAddUserOpen(false);
        }}
        listProps={{
          visibleColumns: ['avatar', 'staticDisplayName'],
          users: visibleAddUsers,
        }}
        commandBarProps={{
          visibleColumns: [],
          items: addUserCommandItems,
        }}
      />
      <SearchBox
        placeholder="Search members..."
        onChange={(event, newValue) => debouncedSearch(newValue)}
      />
      <CommandBar
        className={styles.commandBar}
        items={commandActions}
        styles={{ root: { padding: 0 } }}
      />
      <UserList
        visibleColumns={['avatar', 'staticDisplayName']}
        users={visibleUsers}
      />
    </>
  );
};

export default composeWrappers({
  usersContext: UsersContextProvider,
})(GroupMembers);
