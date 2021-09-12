import UserList, {
  IUserListProps,
} from '@admin/features/users/components/user-list';
import {
  IUsersContext,
  UsersContextProvider,
  useUsers,
} from '@admin/features/users/context/users.context';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import UserCommandBar, {
  IUserCommandBarProps,
} from '@admin/features/users/components/user-command-bar';
import { composeWrappers } from '@admin/helpers/hoc';

export interface IUserSelectProps {
  listProps?: IUserListProps;
  commandBarProps?: IUserCommandBarProps;
  suppressDefaultUpdates?: boolean;
}

export interface IUserSelectRef {
  usersContext: IUsersContext;
}

const UserSelect = forwardRef<IUserSelectRef, IUserSelectProps>(
  (
    {
      listProps = { visibleColumns: ['avatar', 'staticDisplayName'] },
      commandBarProps = { visibleColumns: ['search', 'refresh'] },
      suppressDefaultUpdates = false,
    },
    ref
  ) => {
    const usersContext = useUsers();

    useImperativeHandle(ref, () => ({
      usersContext,
    }));

    const updateList = () => {
      if (!suppressDefaultUpdates) {
        usersContext.list.execute();
      }
    };

    useEffect(updateList, []);
    useEffect(updateList, [usersContext.listParams]);

    return (
      <>
        <UserCommandBar {...commandBarProps} />
        <UserList {...listProps} />
      </>
    );
  }
);

export default composeWrappers({
  usersContext: UsersContextProvider,
})(UserSelect);
