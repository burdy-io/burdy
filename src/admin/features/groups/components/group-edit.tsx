import {
  DefaultButton,
  makeStyles,
  Panel,
  PanelType,
  PersonaCoin,
  PersonaInitialsColor,
  PersonaSize,
  Pivot,
  PivotItem,
  PrimaryButton,
  Stack,
  Text,
} from '@fluentui/react';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useHistory, useParams } from 'react-router';
import { useGroups } from '@admin/features/groups/context/groups.context';
import * as yup from 'yup';
import { usePermissions } from '@admin/features/permissions/context/permissions.context';
import GroupMembers from '@admin/features/groups/components/group-members';
import LoadingBar from '@admin/components/loading-bar';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { ControlledTextField } from '@admin/components/rhf-components';
import { IGroup as IGroupModel } from '@shared/interfaces/model';
import StatusBar from '@admin/components/status-bar';
import PermissionSelect from '@admin/features/permissions/components/permission-select';
import PermissionChips from '@admin/features/permissions/components/permission-chips';

const useStyles = makeStyles({
  personaCoin: {
    paddingRight: 20,
  },
  mainInformation: {
    marginTop: 36,
    marginBottom: 24,
  },
  content: {
    marginTop: 24,
  },
});

const schema = yup.object({
  name: yup.string().required().min(1).label('Name'),
  description: yup.string().label('Description'),
});

const GroupEdit = () => {
  const groups = useGroups();
  const permissions = usePermissions();
  const [open, setOpen] = useState(false);
  const { id } = useParams<any>();
  const history = useHistory();
  const baseRef = useRef<any>();
  const currentGroup = groups.get.result;

  const close = useCallback(() => {
    history.push('/settings/groups');
  }, [history]);

  const Footer = useCallback(
    () => (
      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <PrimaryButton
          onClick={baseRef.current?.submit}
          disabled={groups.update.loading}
          data-cy="groups-edit-submit"
        >
          Update
        </PrimaryButton>
        <DefaultButton onClick={() => setOpen(false)}>Cancel</DefaultButton>
      </Stack>
    ),
    [groups.update.loading]
  );

  useEffect(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    groups.get.execute(id);
    permissions.list.execute();
  }, []);

  return (
    <Panel
      isOpen={open}
      onDismiss={() => setOpen(false)}
      onDismissed={close}
      headerText="Edit group"
      onRenderFooterContent={Footer}
      isFooterAtBottom
      type={PanelType.medium}
      data-cy="groups-edit"
    >
      <LoadingBar loading={!currentGroup || permissions.list.loading}>
        <GroupEditBase
          baseRef={baseRef}
          close={() => setOpen(false)}
          group={currentGroup}
        />
      </LoadingBar>
    </Panel>
  );
};

interface GroupEditBaseProps {
  baseRef: React.Ref<any>;
  group: IGroupModel;
  close: Function;
}

const GroupEditBase: React.FC<GroupEditBaseProps> = ({
  baseRef,
  close,
  group,
}) => {
  const styles = useStyles();
  const groups = useGroups();
  const [users, setUsers] = useState(group?.users);
  const permissions = usePermissions();
  const { control, handleSubmit, setValue, register } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      id: group?.id,
      name: group?.name,
      description: group?.description,
      permissions: group?.permissions ?? [],
      users: group?.users ?? ([] as any),
    },
  });

  useEffect(() => {
    setUsers(group?.users);
    permissions.selection.select(group.permissions);

    register('users');
    register('permissions');
  }, []);

  useEffect(() => {
    setValue('users', users);
  }, [users]);

  useEffect(() => {
    setValue(
      'permissions',
      permissions.selectedPermissions.flatMap((p) => p.id)
    );
  }, [permissions.selectedPermissions]);

  const submit = handleSubmit(async (data) => {
    try {
      await groups.update.execute(data);
      close?.();
    } catch (e) {
      //
    }
  });

  useImperativeHandle(baseRef, () => ({
    submit,
  }));

  return (
    <>
      <Stack
        horizontal
        verticalAlign="center"
        className={styles.mainInformation}
      >
        <Stack.Item>
          <PersonaCoin
            text={group?.name}
            initialsColor={PersonaInitialsColor.blue}
            size={PersonaSize.size100}
            className={styles.personaCoin}
          />
        </Stack.Item>
        <Stack.Item>
          <Stack>
            <Text variant="xxLarge">
              <b> {group?.name}</b>
            </Text>
            <Text>{group?.users?.length} members</Text>
          </Stack>
        </Stack.Item>
      </Stack>
      <Pivot data-cy="groups-edit-tabs">
        <PivotItem headerText="General" className={styles.content}>
          <Stack tokens={{ childrenGap: 12 }} horizontalAlign="center">
            <Stack tokens={{ childrenGap: 16 }} style={{ width: '100%' }}>
              <StatusBar controller={groups.update} />
              <Stack tokens={{ childrenGap: 16 }}>
                <ControlledTextField
                  control={control}
                  label="Name"
                  name="name"
                  autoComplete="off"
                  data-cy="groups-edit-name"
                />
                <ControlledTextField
                  control={control}
                  name="description"
                  label="Description"
                  autoComplete="off"
                  multiline
                  data-cy="groups-edit-description"
                />
                {!group?.protected && (
                  <>
                    <Text style={{ fontWeight: 600 }}>
                      Permissions (
                      {permissions.selectedPermissions?.length ?? 0})
                    </Text>
                    <PermissionChips
                      permissions={permissions.selectedPermissions}
                    />
                  </>
                )}
              </Stack>
            </Stack>
          </Stack>
        </PivotItem>
        {!group?.protected && (
          <PivotItem headerText="Manage Permissions">
            <PermissionSelect unwrap />
          </PivotItem>
        )}
        <PivotItem headerText="Members" className={styles.content} alwaysRender>
          <GroupMembers
            users={users}
            setUsers={setUsers}
            close={close}
            isProtected={group?.protected}
          />
        </PivotItem>
      </Pivot>
    </>
  );
};

export default GroupEdit;
