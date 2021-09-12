import React, { useMemo } from 'react';
import { useGroups } from '@admin/features/groups/context/groups.context';
import {
  IColumn,
  IShimmeredDetailsListProps,
  MarqueeSelection,
  SelectionMode,
  ShimmeredDetailsList,
  Text,
} from '@fluentui/react';
import { IGroup } from '@shared/interfaces/model';
import { Link } from '@admin/components/links';
import { useHistory } from 'react-router';

type ColumnTypes = 'id' | 'name' | 'description' | 'protected';

export interface IGroupListProps extends Partial<IShimmeredDetailsListProps> {
  overrideGroups?: IGroup[];
  visibleColumns?: ColumnTypes[];
}

const GroupList: React.FC<IGroupListProps> = ({
  overrideGroups,
  visibleColumns,
  ...props
}) => {
  const { list, groups, selection } = useGroups();
  const history = useHistory();

  const listGroups = useMemo(
    () => overrideGroups ?? groups,
    [overrideGroups, groups]
  );

  const columns = useMemo<IColumn[]>(
    () => [
      {
        key: 'id',
        name: 'ID',
        fieldName: 'id',
        minWidth: 24,
        maxWidth: 24,
      },
      {
        key: 'name',
        name: 'Name',
        fieldName: 'name',
        minWidth: 32,
        maxWidth: 200,
        onRender: (item: IGroup) => (
          <Text variant="medium">
            <Link to={`/settings/groups/edit/${item.id}`}>{item.name}</Link>
          </Text>
        ),
      },
      {
        key: 'description',
        name: 'Description',
        fieldName: 'description',
        minWidth: 80,
      },
      {
        key: 'protected',
        name: 'Protected',
        minWidth: 80,
        maxWidth: 120,
        onRender: (item: IGroup) => (item.protected ? 'Yes' : 'No'),
      },
    ],
    []
  );

  return (
    <div>
      <MarqueeSelection
        selection={selection as any}
        isDraggingConstrainedToRoot
      >
        <ShimmeredDetailsList
          enableShimmer={list?.loading}
          selection={selection as any}
          selectionMode={SelectionMode.multiple}
          setKey="multiple"
          selectionPreservedOnEmptyClick
          items={listGroups ?? []}
          columns={columns}
          onItemInvoked={(item) =>
            history.push(`/settings/groups/edit/${item.id}`)
          }
          {...props}
        />
      </MarqueeSelection>
    </div>
  );
};

export default GroupList;
