import React from 'react';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import {
  CommunicationColors,
  makeStyles,
  Persona,
  PersonaInitialsColor,
  PersonaSize,
  PrimaryButton,
  Stack
} from '@fluentui/react';
import { useHistory } from 'react-router';
import { userPersonaText } from '@admin/helpers/misc';

const useStyles = makeStyles((theme) => ({
  header: {
    position: 'relative',
    display: 'flex',
    background: CommunicationColors.primary,
    width: '100%'
  },
  menu: {
    display: 'flex',
    alignItems: 'center',
    width: '100%'
  },
  dropdownRight: {
    right: '0 !important',
    left: 'auto !important'
  },
  divider: {
    flexGrow: 1
  },
  button: {
    color: `${theme.palette.white} !important`
  }
}));

const Header = () => {
  const { user, logOut } = useAuth();
  const history = useHistory();
  const styles = useStyles();

  return (
    <header className={styles.header}>
      <Stack
        horizontal
        horizontalAlign='space-between'
        style={{ width: '100%' }}
      >
        <Stack horizontal>
          <PrimaryButton
            className={styles.button}
            menuIconProps={{ style: { display: 'none' } }}
            style={{ height: 48 }}
            href='/admin'
          >
            Burdy
          </PrimaryButton>
        </Stack>
        <Stack horizontal>
          <PrimaryButton
            className={styles.button}
            menuIconProps={{ style: { display: 'none' } }}
            style={{ height: 48 }}
            href='https://burdy.io/docs'
            target='_blank'
          >Docs</PrimaryButton>
          <PrimaryButton
            menuIconProps={{ style: { display: 'none' } }}
            style={{ height: 48, minWidth: 0, padding: '0 12px' }}
            onRenderIcon={() => (
              <Persona
                size={PersonaSize.size32}
                initialsColor={PersonaInitialsColor.rust}
                text={userPersonaText(user)}
                hidePersonaDetails
              />
            )}
            menuProps={{
              items: [
                {
                  key: 'profile',
                  text: 'Profile',
                  onClick: () => {
                    history.push(`/users/edit/${user.id}`);
                  }
                },
                {
                  key: 'logout',
                  text: 'Log Out',
                  onClick: () => {
                    logOut.execute();
                  }
                }
              ]
            }}
          />
        </Stack>
      </Stack>
    </header>
  );
};

export default Header;
