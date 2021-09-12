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
import React, { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { useGroups } from '@admin/features/groups/context/groups.context';
import * as yup from 'yup';
import { usePermissions } from '@admin/features/permissions/context/permissions.context';
import GroupMembers from '@admin/features/groups/components/group-members';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { ControlledTextField } from '@admin/components/rhf-components';
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

const GroupAdd = () => {
  const styles = useStyles();
  const { create } = useGroups();
  const { list, selectedPermissions } = usePermissions();
  const history = useHistory();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const { control, setValue, handleSubmit, watch, register } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
      users: [],
    },
  });

  const [name] = watch(['name']);

  const close = useCallback(() => {
    history.push('/settings/groups');
  }, []);

  useEffect(() => {
    list.execute();

    register('users');
    register('permissions');
  }, []);

  useEffect(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    setValue('users', users);
  }, [users]);

  useEffect(() => {
    setValue(
      'permissions',
      selectedPermissions.flatMap((p) => p.id)
    );
  }, [selectedPermissions]);

  const submit = handleSubmit(async (data) => {
    try {
      await create.execute(data);
      close();
    } catch (e) {
      //
    }
  });

  const Footer = useCallback(
    () => (
      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <PrimaryButton data-cy="groups-add-submit" onClick={submit}>Create</PrimaryButton>
        <DefaultButton onClick={close}>Cancel</DefaultButton>
      </Stack>
    ),
    []
  );

  return (
    <Panel
      isOpen={open}
      onDismiss={() => setOpen(false)}
      onDismissed={close}
      headerText="Create a group"
      onRenderFooterContent={Footer}
      isFooterAtBottom
      type={PanelType.medium}
      data-cy="groups-add"
    >
      <Stack
        horizontal
        verticalAlign="center"
        className={styles.mainInformation}
      >
        <Stack.Item>
          <PersonaCoin
            text={name}
            initialsColor={PersonaInitialsColor.blue}
            size={PersonaSize.size100}
            className={styles.personaCoin}
          />
        </Stack.Item>
        <Stack.Item>
          <Stack>
            <Text variant="xxLarge">
              <b>{name}</b>
            </Text>
            <Text>{users.length} members</Text>
          </Stack>
        </Stack.Item>
      </Stack>
      <StatusBar controller={create} />
      <Pivot data-cy="groups-add-tabs">
        <PivotItem headerText="General" className={styles.content}>
          <Stack tokens={{ childrenGap: 12 }} horizontalAlign="center">
            <Stack tokens={{ childrenGap: 16 }} style={{ width: '100%' }}>
              <Stack tokens={{ childrenGap: 16 }}>
                <ControlledTextField
                  control={control}
                  label="Name"
                  name="name"
                  autoComplete="off"
                  data-cy="groups-add-name"
                />
                <ControlledTextField
                  control={control}
                  label="Description"
                  name="description"
                  autoComplete="off"
                  multiline
                  data-cy="groups-add-description"
                />
                <Text style={{ fontWeight: 600 }}>
                  Permissions ({selectedPermissions.length})
                </Text>
                <PermissionChips permissions={selectedPermissions} />
              </Stack>
            </Stack>
          </Stack>
        </PivotItem>
        <PivotItem headerText="Manage Permissions">
          <PermissionSelect unwrap />
        </PivotItem>
        <PivotItem headerText="Members" className={styles.content}>
          <GroupMembers
            users={users}
            setUsers={setUsers}
            isProtected={false}
            close={close}
          />
        </PivotItem>
      </Pivot>
    </Panel>
  );
};

export default GroupAdd;
