import React, { useMemo } from 'react';
import {
  CommandBar,
  ICommandBarItemProps,
  ICommandBarProps,
  NeutralColors,
} from '@fluentui/react';
import { useGroups } from '@admin/features/groups/context/groups.context';
import { useHistory } from 'react-router';
import { useDialog } from '@admin/context/dialog';
import _ from 'lodash';

type ColumnType = 'add' | 'edit' | 'delete' | 'refresh';

export interface IGroupCommandBarProps extends Partial<ICommandBarProps> {
  visibleColumns?: ColumnType[];
}

const GroupCommandBar: React.FC<IGroupCommandBarProps> = ({
  visibleColumns = ['add', 'edit', 'delete', 'refresh'],
  ...props
}) => {
  const dialog = useDialog();
  const { selectedGroups, deleteMany, list } = useGroups();
  const history = useHistory();

  const commandList = useMemo<ICommandBarItemProps[]>(
    () =>
      [
        {
          key: 'add',
          text: 'Add a group',
          'data-cy': 'groups-commandBar-add',
          iconProps: { iconName: 'AddFriend' },
          onClick: () => {
            history.push('/settings/groups/add');
          },
        },
        {
          key: 'edit',
          text: 'Edit group',
          'data-cy': 'groups-commandBar-edit',
          iconProps: { iconName: 'Edit' },
          disabled: selectedGroups.length !== 1,
          onClick: () => {
            history.push(`/settings/groups/edit/${selectedGroups?.[0]?.id}`);
          },
        },
        {
          key: 'delete',
          text: 'Delete group',
          'data-cy': 'groups-commandBar-delete',
          iconProps: { iconName: 'Delete' },
          disabled:
            selectedGroups.length === 0 ||
            selectedGroups.some((g) => g.protected),
          onClick: () => {
            dialog
              .confirm(
                'Delete Groups',
                'Are you sure? Some accesses might be revoked from users.'
              )
              .then(async () => {
                await deleteMany.execute(_.map(selectedGroups, 'id'));
              })
              .catch((e) => e);
          },
        },
        {
          key: 'refresh',
          text: 'Refresh',
          'data-cy': 'groups-commandBar-refresh',
          iconProps: { iconName: 'Refresh' },
          onClick: () => {
            list.execute();
          },
        },
      ].filter(({ key }) => visibleColumns.includes(key as ColumnType)),
    [selectedGroups, visibleColumns]
  );

  return (
    <CommandBar
      items={commandList}
      style={{ borderBottom: `1px solid ${NeutralColors.gray30}` }}
      {...props}
    />
  );
};

export default GroupCommandBar;
