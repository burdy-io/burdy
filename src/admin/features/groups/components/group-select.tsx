import GroupList, {
  IGroupListProps,
} from '@admin/features/groups/components/group-list';
import GroupCommandBar, {
  IGroupCommandBarProps,
} from '@admin/features/groups/components/group-command-bar';
import {
  GroupsContextProvider,
  IGroupsContext,
  useGroups,
} from '@admin/features/groups/context/groups.context';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { composeWrappers } from '@admin/helpers/hoc';

export interface IGroupSelectProps {
  listProps?: IGroupListProps;
  commandBarProps?: IGroupCommandBarProps;
  suppressDefaultUpdates?: boolean;
}

export interface IGroupSelectRef {
  groupsContext: IGroupsContext;
}

const GroupSelect = forwardRef<IGroupSelectRef, IGroupSelectProps>(
  (
    {
      listProps = { visibleColumns: ['id', 'name', 'description'] },
      commandBarProps = { visibleColumns: ['refresh'] },
      suppressDefaultUpdates = false,
    },
    ref
  ) => {
    const groupsContext = useGroups();

    useImperativeHandle(ref, () => ({
      groupsContext,
    }));

    const updateList = () => {
      if (!suppressDefaultUpdates) {
        groupsContext.list.execute();
      }
    };

    useEffect(updateList, []);

    return (
      <>
        <GroupCommandBar {...commandBarProps} />
        <GroupList {...listProps} />
      </>
    );
  }
);

export default composeWrappers({
  groupsContext: GroupsContextProvider,
})(GroupSelect);
