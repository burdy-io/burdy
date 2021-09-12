import React, { useEffect } from 'react';
import UserList from '@admin/features/users/components/user-list';
import UserCommandBar from '@admin/features/users/components/user-command-bar';
import {
  UsersContextProvider,
  useUsers,
} from '@admin/features/users/context/users.context';
import UserAdd from '@admin/features/users/components/user-add';
import { Route } from 'react-router';
import UserEdit from '@admin/features/users/components/user-edit';
import { composeWrappers } from '@admin/helpers/hoc';

const UsersPage = () => {
  const { list, listParams } = useUsers();

  const updateList = () => {
     list.execute();
  };

  useEffect(updateList, []);
  useEffect(updateList, [listParams]);

  return (
    <>
      <div className="page-wrapper">
        <UserCommandBar />
        <div
          className="page-content page-content-scroll"
          style={{ padding: '0 1rem' }}
        >
          <UserList />
        </div>
      </div>
      <Route path="/users/add" component={UserAdd} />
      <Route path="/users/edit/:id" component={UserEdit} />
    </>
  );
};

export default composeWrappers({
  usersContext: UsersContextProvider,
})(UsersPage);
