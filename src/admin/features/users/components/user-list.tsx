import React, { useMemo } from 'react';
import { IUser } from '@shared/interfaces/model';
import {
  IColumn,
  IShimmeredDetailsListProps,
  makeStyles,
  MarqueeSelection,
  Persona,
  PersonaSize,
  ShimmeredDetailsList,
  Stack,
  Text,
} from '@fluentui/react';
import { useUsers } from '@admin/features/users/context/users.context';
import {formatDate, userPersonaText} from '@admin/helpers/misc';
import { useHistory } from 'react-router';
import { Link } from '@admin/components/links';

const useStyles = makeStyles({
  userList: {
    ':global(.ms-DetailsRow-fields)': {
      alignItems: 'center !important',
    },
    ':global(.ms-DetailsRow-check)': {
      height: '100% !important',
    },
  },
});

type ColumnTypes =
  | 'avatar'
  | 'displayName'
  | 'staticDisplayName'
  | 'groups'
  | 'status'
  | 'createdAt';

export interface IUserListProps extends Partial<IShimmeredDetailsListProps> {
  visibleColumns?: ColumnTypes[];
  users?: IUser[];
}

const UserList: React.FC<IUserListProps> = ({
  visibleColumns = ['avatar', 'displayName', 'groups', 'status', 'createdAt'],
  users = undefined,
  ...props
}) => {
  const styles = useStyles();
  const { list, selection, users: contextUsers } = useUsers();
  const history = useHistory();

  const listUsers = useMemo(() => users ?? contextUsers, [users, contextUsers]);

  const availableColumns = useMemo<IColumn[]>(
    () => [
      {
        key: 'avatar',
        name: 'Avatar',
        isIconOnly: true,
        iconName: 'Contact',
        minWidth: 32,
        maxWidth: 32,
        onRender: (userModel: IUser) => (
          <Persona
            text={userPersonaText(userModel)}
            size={PersonaSize.size32}
          />
        ),
        styles: {
          cellTitle: {
            justifyContent: 'center',
          },
        },
      },
      {
        key: 'displayName',
        name: 'Display Name',
        minWidth: 200,
        maxWidth: 260,
        onRender: (userModel: IUser) => (
          <Link to={`/users/edit/${userModel.id}`}>
            <Stack>
              <Stack.Item>
                <Text>
                  {userModel?.firstName ?? ''} {userModel?.lastName ?? ''}
                </Text>
              </Stack.Item>
              <Stack.Item>
                <Text style={{ opacity: 0.9 }} variant="small">
                  {userModel.email}
                </Text>
              </Stack.Item>
            </Stack>
          </Link>
        ),
      },
      {
        key: 'staticDisplayName',
        name: 'Display Name',
        minWidth: 200,
        maxWidth: 260,
        onRender: (userModel: IUser) => (
          <Stack>
            <Stack.Item>
              <Text>
                {userModel?.firstName ?? ''} {userModel?.lastName ?? ''}
              </Text>
            </Stack.Item>
            <Stack.Item>
              <Text style={{ opacity: 0.9 }} variant="small">
                {userModel.email}
              </Text>
            </Stack.Item>
          </Stack>
        ),
      },
      {
        key: 'groups',
        fieldName: 'groups',
        name: 'Groups',
        minWidth: 80,
        onRender: ({ groups }: IUser) => (
          <div>{groups.map((group) => group.name).join(', ')}</div>
        ),
      },
      {
        key: 'status',
        fieldName: 'status',
        name: 'Status',
        minWidth: 0,
      },
      {
        key: 'createdAt',
        fieldName: 'createdAt',
        name: 'Created At',
        minWidth: 200,
        onRender: ({ createdAt }: IUser) => (
          <div>{formatDate(createdAt)}</div>
        ),
      },
    ],
    []
  );

  const columns = useMemo(
    () =>
      availableColumns.filter(({ key }) =>
        visibleColumns.includes(key as ColumnTypes)
      ),
    [visibleColumns]
  );

  return (
    <div className={styles.userList}>
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
          onItemInvoked={(item: IUser) => {
            history.push(`/users/edit/${item.id}`);
          }}
          items={listUsers ?? []}
          columns={columns}
          {...props}
        />
      </MarqueeSelection>
    </div>
  );
};

export default UserList;
