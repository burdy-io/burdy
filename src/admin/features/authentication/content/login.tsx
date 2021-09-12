import React, { useEffect } from 'react';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import { Link } from '@admin/components/links';
import classNames from 'classnames';
import {
  makeStyles,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Stack,
  Text,
} from '@fluentui/react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { ControlledTextField } from '@admin/components/rhf-components';
import logo from '../../../assets/logo.svg';

const useStyles = makeStyles({
  wrapper: {
    width: 360,
    marginLeft: 'auto !important',
    marginRight: 'auto !important',
    textAlign: 'left',
    marginBottom: '2%',
  },
  container: {
    minHeight: '100vh',
    minWidth: '100vw',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#faf9f8',
  },
  card: {
    marginBottom: '2rem',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    textAlign: 'center',
    marginBottom: '1rem !important',
  },
  button: {
    marginTop: '1rem',
    width: '100%',
  },
  alert: {
    marginBottom: '1rem !important',
    textAlign: 'center',
  },
  logo: {
    margin: '0 auto 0.5rem 0',
    display: 'block',
  },
});

const formSchema = yup.object({
  email: yup.string().email().required().label('Email'),
  password: yup.string().min(6).label('Password'),
});

const LogIn: React.FC<any> = () => {
  const styles = useStyles();
  const { logIn } = useAuth();
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const submit = handleSubmit((data) => {
    logIn.execute(data);
  });

  useEffect(() => {
    logIn.reset();
  }, []);

  return (
    <div className={styles.container}>
      <div className={classNames(styles.wrapper, 'card')}>
        <img
          src={logo}
          width={36}
          height={36}
          alt="Burdy"
          className={styles.logo}
        />
        <Stack tokens={{ childrenGap: 8, padding: '0 0 16px' }}>
          <Text variant="xLargePlus" block>
            Burdy.js
          </Text>
          <Text variant="medium" block>
            Log in to continue.
          </Text>
        </Stack>
        {logIn.error?.message && (
          <MessageBar
            className={styles.alert}
            messageBarType={MessageBarType.error}
          >
            {logIn.error.message}
          </MessageBar>
        )}
        <Stack tokens={{ childrenGap: 10 }}>
          <form onSubmit={submit}>
            <ControlledTextField
              control={control}
              type="email"
              name="email"
              label="Email"
              required
              data-cy="login-email"
            />
            <ControlledTextField
              control={control}
              name="password"
              label="Password"
              required
              canRevealPassword
              type="password"
              data-cy="login-password"
            />
            <Stack
              horizontal
              verticalAlign="end"
              horizontalAlign="space-between"
            >
              <Stack.Item shrink={false}>
                <Link to="/forgot">Can't access account?</Link>
              </Stack.Item>
              <Stack.Item shrink>
                <PrimaryButton
                  className={styles.button}
                  type="submit"
                  disabled={logIn.loading}
                  data-cy="login-submit"
                >
                  Log In
                </PrimaryButton>
              </Stack.Item>
            </Stack>
          </form>
        </Stack>
      </div>
    </div>
  );
};

export default LogIn;
