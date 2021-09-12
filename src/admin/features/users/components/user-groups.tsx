import {withGroupsContext} from '@admin/helpers/hoc';
import BackPanel from '@admin/components/back-panel';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  CommandBar,
  CommunicationColors,
  DefaultButton,
  IColumn,
  ICommandBarItemProps,
  makeStyles,
  MarqueeSelection,
  PanelType,
  PrimaryButton,
  Selection,
  SelectionMode,
  ShimmeredDetailsList,
  Stack,
} from '@fluentui/react';
import {IGroup, IUser} from '@shared/interfaces/model';
import {differenceBy, sortBy, sortedUniqBy} from 'lodash';
import {useGroups} from '@admin/features/groups/context/groups.context';
import {useHistory} from 'react-router';
import {useAuth} from '@admin/features/authentication/context/auth.context';

const useStyles = makeStyles({
  detailList: {
    ':global(.ms-DetailsRow-check)': {
      height: '100% !important',
    },
  },
  commandBar: {
    marginTop: 12,
  },
});

interface UserGroupsProps {
  groups: IGroup[];
  setGroups: (groups: IGroup[]) => void;
  user?: IUser;
  close?: Function;
}

const UserGroups: React.FC<UserGroupsProps> = ({
                                                 close,
                                                 groups,
                                                 setGroups,
                                                 user,
                                               }) => {
  const styles = useStyles();
  const auth = useAuth();
  const history = useHistory();
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<IGroup[]>([]);
  const groupsContext = useGroups();
  const selection = useMemo(
    () =>
      new Selection<IGroup>({
        selectionMode: SelectionMode.multiple,
        getKey: (item) => item.id,
        onSelectionChanged: () => setSelectedGroups(selection.getSelection()),
      }),
    []
  );

  const selectableGroups = useMemo(
    () => differenceBy(groupsContext?.list?.result ?? [], groups, 'id'),
    [groupsContext.list.result, groups]
  );

  useEffect(() => {
    if (addGroupOpen) {
      groupsContext.list.execute();
    }
  }, [addGroupOpen]);

  const commandActions = useMemo<ICommandBarItemProps[]>(
    () => [
      {
        key: 'add',
        text: 'Add groups',
        'data-cy': 'users-groups-add',
        iconProps: {iconName: 'Add'},
        onClick: () => setAddGroupOpen(true),
      },
      {
        key: 'delete',
        text: 'Remove memberships',
        'data-cy': 'users-groups-remove',
        iconProps: {iconName: 'Delete'},
        disabled:
          selectedGroups.length === 0 ||
          (selectedGroups.some((g) => g.protected) &&
            auth.user.id === user?.id),
        onClick: () => {
          const selectedGroupIds = selectedGroups.map((g) => g.id);
          setGroups(groups.filter((g) => !selectedGroupIds.includes(g.id)));
        },
      },
    ],
    [setGroups, groups, auth, selectedGroups]
  );

  const columns = useMemo<IColumn[]>(
    () => [
      {
        key: 'id',
        name: 'ID',
        fieldName: 'id',
        minWidth: 40,
        maxWidth: 40,
      },
      {
        key: 'name',
        name: 'Name',
        fieldName: 'name',
        minWidth: 80,
        maxWidth: 120,
        onRender: (item: IGroup) => (
          <div style={{fontSize: 14, color: CommunicationColors.shade10}}>
            {item.name}
          </div>
        ),
      },
      {
        key: 'description',
        name: 'Description',
        fieldName: 'description',
        minWidth: 120,
      },
    ],
    []
  );

  const renderFooterContent = useCallback(
    () => (
      <Stack horizontal tokens={{childrenGap: 10}}>
        <PrimaryButton
          data-cy="users-groups-submit"
          onClick={() => {
            setGroups(
              sortedUniqBy(
                sortBy(
                  [...groups, ...groupsContext.selection.getSelection()],
                  'id'
                ),
                'id'
              )
            );
            setAddGroupOpen(false);
          }}
        >
          Add Group(s)
        </PrimaryButton>
        <DefaultButton data-cy="users-groups-cancel" onClick={() => setAddGroupOpen(false)}>Cancel</DefaultButton>
      </Stack>
    ),
    [groups, setGroups, setAddGroupOpen, close, groupsContext]
  );

  return (
    <>
      <BackPanel
        title="Add Groups"
        type={PanelType.medium}
        isOpen={addGroupOpen}
        onBack={() => setAddGroupOpen(false)}
        onDismiss={() => close?.()}
        isFooterAtBottom
        onRenderFooterContent={renderFooterContent}
        data-cy="users-groups-panel"
      >
        <MarqueeSelection
          selection={groupsContext.selection as any}
          isDraggingConstrainedToRoot
        >
          <ShimmeredDetailsList
            selection={groupsContext.selection as any}
            enableShimmer={groupsContext.list.loading}
            selectionMode={SelectionMode.multiple}
            setKey="multiple"
            selectionPreservedOnEmptyClick
            className={styles.detailList}
            onItemInvoked={(item: IUser) => {
              history.push(`/settings/groups/edit/${item.id}`);
            }}
            items={Array.isArray(selectableGroups) ? selectableGroups : []}
            columns={columns}
          />
        </MarqueeSelection>
      </BackPanel>
      <div data-cy="users-groups">
        <CommandBar
          className={styles.commandBar}
          items={commandActions}
          styles={{root: {padding: 0}}}
        />
        <MarqueeSelection
          selection={selection as any}
          isDraggingConstrainedToRoot
        >
          <ShimmeredDetailsList
            selection={selection as any}
            selectionMode={SelectionMode.multiple}
            setKey="multiple"
            selectionPreservedOnEmptyClick
            className={styles.detailList}
            onItemInvoked={(item: IUser) => {
              history.push(`/settings/groups/edit/${item.id}`);
            }}
            items={Array.isArray(groups) ? groups : []}
            columns={columns}
          />
        </MarqueeSelection>
      </div>
    </>
  );
};

export default withGroupsContext(UserGroups);
