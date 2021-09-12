import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionButton,
  DefaultButton,
  makeStyles,
  MessageBarType,
  Panel,
  PanelType,
  PersonaCoin,
  PersonaInitialsColor,
  PersonaSize,
  Pivot,
  PivotItem,
  PrimaryButton,
  Separator,
  Stack,
  Text,
} from '@fluentui/react';
import LoadingBar from '@admin/components/loading-bar';
import * as yup from 'yup';
import { useHistory, useParams } from 'react-router';
import { useUsers } from '@admin/features/users/context/users.context';
import { withGroupsContext } from '@admin/helpers/hoc';
import { userMeta } from '@admin/helpers/misc';
import { useDialog } from '@admin/context/dialog';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import BackPanel from '@admin/components/back-panel';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  ControlledCheckbox,
  ControlledTextField,
} from '@admin/components/rhf-components';
import StatusBar from '@admin/components/status-bar';
import UserGroups from '@admin/features/users/components/user-groups';
import { IGroup, UserStatus } from '@shared/interfaces/model';
import generator from 'generate-password-browser';
import copy from 'copy-text-to-clipboard';
import { useSnackbar } from '@admin/context/snackbar';

const useStyles = makeStyles({
  content: {
    paddingTop: 18,
  },
  mainInformation: {
    marginTop: 36,
    marginBottom: 24,
  },
  personaCoin: {
    paddingRight: 20,
  },
});

const schema = yup.object({
  firstName: yup.string().label('First name'),
  lastName: yup.string().label('Last name'),
  meta: yup.object({
  }),
});

const resetSchema = yup.object({
  currentPassword: yup.string().min(6).required().label('Current Password'),
  password: yup.string().min(6).required().label('Password'),
  confirmPassword: yup
    .string()
    .min(6)
    .required()
    .oneOf([yup.ref('password'), null], 'Passwords must match.')
    .label('Confirm password'),
});

const userResetSchema = yup.object({
  password: yup.string().min(6).required().label('Password'),
});

const ProfilePasswordReset = ({ resetOpen, setResetOpen }) => {
  const history = useHistory();
  const { updatePassword } = useAuth();
  const { control, handleSubmit, reset } = useForm({
    resolver: yupResolver(resetSchema),
    defaultValues: {
      currentPassword: '',
      password: '',
      confirmPassword: '',
    },
  });

  const submit = handleSubmit(async (data) => {
    try {
      await updatePassword.execute(data);
      reset();
    } catch (e) {
      //
    }
  });

  useEffect(
    () => () => {
      updatePassword.reset();
    },
    []
  );

  const renderFooterContent = useCallback(
    () => (
      <Stack tokens={{ childrenGap: 10 }} horizontal>
        <PrimaryButton onClick={submit} disabled={updatePassword.loading}>
          Reset Password
        </PrimaryButton>
        <DefaultButton onClick={() => setResetOpen(false)}>
          Cancel
        </DefaultButton>
      </Stack>
    ),
    [submit, setResetOpen, updatePassword.loading]
  );

  return (
    <BackPanel
      title="Change Password"
      isOpen={resetOpen}
      onBack={() => setResetOpen(false)}
      onDismiss={() => history.push('/users/')}
      type={PanelType.medium}
      isFooterAtBottom
      onRenderFooterContent={renderFooterContent}
    >
      <StatusBar
        controller={updatePassword}
        successMessage="You've successfully reset the password."
      />
      <form onSubmit={submit}>
        <Stack tokens={{ childrenGap: 8 }} style={{ marginTop: 12 }}>
          <ControlledTextField
            control={control}
            label="Current Password"
            name="currentPassword"
            autoComplete="off"
            type="password"
            canRevealPassword
          />
          <ControlledTextField
            control={control}
            label="New Password"
            name="password"
            autoComplete="off"
            type="password"
            canRevealPassword
          />
          <ControlledTextField
            control={control}
            label="Confirm New Password"
            name="confirmPassword"
            autoComplete="off"
            type="password"
            canRevealPassword
          />
        </Stack>
      </form>
    </BackPanel>
  );
};

const UserPasswordReset = ({ resetOpen, setResetOpen }) => {
  const users = useUsers();
  const history = useHistory();
  const currentUser = users.get.result;

  const { control, handleSubmit, setValue, getValues, reset } = useForm({
    resolver: yupResolver(userResetSchema),
    defaultValues: {
      id: currentUser.id,
      password: '',
      notify: true,
    },
  });

  const submit = handleSubmit(async (data) => {
    try {
      await users.resetPassword.execute(data);
      reset();
    } catch (e) {
      //
    }
  });

  useEffect(
    () => () => {
      users.resetPassword.reset();
    },
    []
  );

  const renderFooterContent = useCallback(
    () => (
      <Stack tokens={{ childrenGap: 10 }} horizontal>
        <PrimaryButton onClick={submit} disabled={users.resetPassword.loading}>
          Reset Password
        </PrimaryButton>
        <DefaultButton onClick={() => setResetOpen(false)}>
          Cancel
        </DefaultButton>
      </Stack>
    ),
    [submit, setResetOpen, users.resetPassword.loading]
  );

  return (
    <BackPanel
      title={`Change password (${currentUser.email})`}
      isOpen={resetOpen}
      onBack={() => setResetOpen(false)}
      onDismiss={() => history.push('/users/')}
      type={PanelType.medium}
      isFooterAtBottom
      onRenderFooterContent={renderFooterContent}
    >
      <StatusBar
        controller={users.resetPassword}
        successMessage="You've successfully reset the password."
      />
      <form onSubmit={submit}>
        <Stack tokens={{ childrenGap: 24 }} style={{ marginTop: 24 }}>
          <ControlledTextField
            control={control}
            label="New Password"
            type="text"
            name="password"
            autoComplete="off"
            styles={{
              suffix: {
                padding: 0,
              },
              fieldGroup: {
                borderRight: 'none',
              },
            }}
            onRenderSuffix={() => (
              <Stack horizontal>
                <PrimaryButton
                  iconProps={{ iconName: 'Refresh' }}
                  style={{ minWidth: 0, padding: '0 4px' }}
                  onClick={() => {
                    setValue(
                      'password',
                      generator.generate({
                        length: 12,
                        numbers: true,
                      })
                    );
                  }}
                />
                <DefaultButton
                  iconProps={{ iconName: 'Copy' }}
                  style={{ minWidth: 0, padding: '0 4px' }}
                  onClick={() => {
                    copy(getValues().password);
                  }}
                />
              </Stack>
            )}
          />
          <ControlledCheckbox
            label="Send new password to the user"
            name="notify"
            control={control}
          />
        </Stack>
      </form>
    </BackPanel>
  );
};

const ProfileActions = ({ setResetOpen }) => (
  <>
    <ActionButton
      iconProps={{ iconName: 'Lock' }}
      onClick={() => setResetOpen(true)}
    >
      Change Password
    </ActionButton>
  </>
);

const UserActions = ({ currentUser, setOpen, id, setResetOpen }) => {
  const users = useUsers();
  const dialog = useDialog();

  return (
    <>
      <ActionButton
        iconProps={{ iconName: 'Lock' }}
        onClick={() => setResetOpen(true)}
      >
        Reset Password
      </ActionButton>
      <Separator vertical />
      <ActionButton
        iconProps={{
          iconName:
            currentUser.status === 'active' ? 'BlockContact' : 'ReminderPerson',
        }}
        onClick={() => {
          (async () => {
            try {
              if (currentUser.status === 'active') {
                await dialog.confirm(
                  `Deactivate ${currentUser.email}?`,
                  'Are you sure you would like to deactivate this account?'
                );
                await users.update.execute(currentUser.id, {
                  status: UserStatus.DISABLED,
                });
              } else {
                await dialog.confirm(
                  `Activate ${currentUser.email}?`,
                  'Are you sure you would like to activate this account?'
                );
                await users.update.execute(currentUser.id, {
                  status: UserStatus.ACTIVE,
                });
              }

              await users.get.execute(id);
            } catch (e) {
              //
            }
          })();
        }}
      >
        {currentUser.status === 'active' ? 'Deactivate' : 'Activate'}
      </ActionButton>
      <Separator vertical />
      <ActionButton
        iconProps={{ iconName: 'Delete' }}
        onClick={() => {
          (async () => {
            try {
              await dialog.confirm(
                `Delete ${currentUser.email}?`,
                'Are you sure you would like to proceed?'
              );
              await users.deleteMany.execute([currentUser.id]);
              setOpen(false);
            } catch (e) {
              //
            }
          })();
        }}
      >
        Delete
      </ActionButton>
    </>
  );
};

const UserEdit = () => {
  const styles = useStyles();
  const users = useUsers();
  const [groups, setGroups] = useState<IGroup[]>([]);
  const auth = useAuth();
  const history = useHistory();
  const { openSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const { id } = useParams<any>();
  const currentUser = users.get.result;
  const [resetOpen, setResetOpen] = useState(false);
  const isProfile = useMemo(
    () => auth.user?.id === currentUser?.id,
    [currentUser, auth.user]
  );
  const { control, reset, handleSubmit, register, getValues, setValue } =
    useForm({
      resolver: yupResolver(schema),
      defaultValues: {
        firstName: '',
        lastName: '',
        meta: {},
        groups: [],
      },
    });

  const [firstName, lastName] = getValues(['firstName', 'lastName']);

  const close = useCallback(() => {
    history.push('/users/');
  }, []);

  const submit = handleSubmit(async (data) => {
    try {
      await users.update.execute(id, data as any);
      setOpen(false);
      openSnackbar({
        message: `User "${currentUser.email}" successfully updated.`,
        messageBarType: MessageBarType.success,
      });
    } catch (e) {
      //
    }
  });

  useEffect(() => {
    register('groups');
    setOpen(true);
    users.get.execute(id);
  }, []);

  useEffect(() => {
    setGroups(currentUser?.groups ?? ([] as any));
    reset({
      firstName: currentUser?.firstName ?? '',
      lastName: currentUser?.lastName ?? '',
    });
  }, [currentUser]);

  useEffect(() => {
    setValue(
      'groups',
      groups.map((g) => g.id)
    );
  }, [groups]);

  const renderFooterContent = useCallback(
    () => (
      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <PrimaryButton data-cy="users-edit-submit" onClick={submit}>Update</PrimaryButton>
        <DefaultButton onClick={() => setOpen(false)}>Cancel</DefaultButton>
      </Stack>
    ),
    [setOpen, submit]
  );

  return (
    <Panel
      isOpen={open}
      headerText={isProfile ? 'Edit Profile' : 'Edit User'}
      isFooterAtBottom
      onRenderFooterContent={renderFooterContent}
      onDismiss={(e) => {
        if (e?.type === 'click') {
          setOpen(false);
        }
      }}
      onDismissed={close}
      type={PanelType.medium}
    >
      <LoadingBar loading={!currentUser}>
        {isProfile ? (
          <ProfilePasswordReset
            resetOpen={resetOpen}
            setResetOpen={setResetOpen}
          />
        ) : (
          <UserPasswordReset
            resetOpen={resetOpen}
            setResetOpen={setResetOpen}
          />
        )}
        <form onSubmit={submit}>
          <Stack
            horizontal
            verticalAlign="center"
            className={styles.mainInformation}
          >
            <Stack.Item>
              <PersonaCoin
                text={`${firstName} ${lastName}`}
                initialsColor={PersonaInitialsColor.blue}
                size={PersonaSize.size100}
                className={styles.personaCoin}
              />
            </Stack.Item>
            <Stack.Item>
              <Stack>
                <Text variant="xxLarge">
                  <b>{`${firstName} ${lastName}`}</b>
                </Text>
                <Text variant="large">{currentUser?.email}</Text>
                <Text variant="small">
                  {currentUser?.groups?.map((group) => group?.name).join(' • ')}
                </Text>
              </Stack>
            </Stack.Item>
          </Stack>
          <Stack
            horizontal
            wrap
            verticalAlign="center"
            tokens={{ childrenGap: 8 }}
          >
            {isProfile ? (
              <ProfileActions setResetOpen={setResetOpen} />
            ) : (
              <UserActions
                id={id}
                currentUser={currentUser}
                setOpen={setOpen}
                setResetOpen={setResetOpen}
              />
            )}
          </Stack>
          <Separator />
          <StatusBar controller={users.update} />
          <Pivot style={{ marginTop: 12 }} data-cy="users-edit-tabs">
            <PivotItem className={styles.content} headerText="Account">
              <Stack tokens={{ childrenGap: 12 }}>
                <Stack horizontal tokens={{ childrenGap: 12 }}>
                  <Stack.Item grow={1}>
                    <ControlledTextField
                      control={control}
                      label="First Name"
                      name="firstName"
                      autoComplete="off"
                      data-cy="users-edit-firstName"
                    />
                  </Stack.Item>
                  <Stack.Item grow={1}>
                    <ControlledTextField
                      control={control}
                      label="Last Name"
                      name="lastName"
                      autoComplete="off"
                      data-cy="users-edit-lastName"
                    />
                  </Stack.Item>
                </Stack>
              </Stack>
            </PivotItem>
            {auth.hasPermission(['users_administration']) && <PivotItem headerText="Groups" className={styles.content}>
              <UserGroups
                close={close}
                user={currentUser}
                groups={groups}
                setGroups={setGroups}
              />
            </PivotItem>}
          </Pivot>
        </form>
      </LoadingBar>
    </Panel>
  );
};

export default withGroupsContext(UserEdit);
