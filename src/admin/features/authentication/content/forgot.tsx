import React, { useEffect } from 'react';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import { Link } from '@admin/components/links';
import classNames from 'classnames';
import {
  DefaultButton,
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
});

const Forgot: React.FC<any> = () => {
  const styles = useStyles();
  const { forgot } = useAuth();
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const submit = handleSubmit((data) => {
    forgot.execute(data);
  });

  useEffect(() => {
    forgot.reset();
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
            Reset your password
          </Text>
          <Text variant="medium" block>
            To reset your password, please enter your email.
          </Text>
        </Stack>
        {forgot.error?.message && (
          <>
            <MessageBar
              className={styles.alert}
              messageBarType={MessageBarType.error}
            >
              {forgot.error.message}
            </MessageBar>
          </>
        )}
        {forgot.status === 'success' ? (
          <>
            <MessageBar
              className={styles.alert}
              messageBarType={MessageBarType.success}
            >
              We've sent an email to <u>{forgot?.currentParams[0]?.email}</u>{' '}
              with instructions on how to reset your password.
            </MessageBar>
            <Link to="/login">
              <DefaultButton iconProps={{ iconName: 'Back' }}>
                Back to Log In
              </DefaultButton>
            </Link>
          </>
        ) : (
          <form onSubmit={submit}>
            <Stack tokens={{ childrenGap: 10 }}>
              <ControlledTextField
                control={control}
                type="email"
                name="email"
                label="Email"
                required
              />
              <Stack
                horizontal
                verticalAlign="end"
                horizontalAlign="space-between"
                padding="16px 0 0"
              >
                <Stack.Item shrink={false}>
                  <Link to="/">Back</Link>
                </Stack.Item>
                <Stack.Item shrink>
                  <PrimaryButton
                    className={styles.button}
                    type="submit"
                    disabled={forgot.loading}
                  >
                    Reset Password
                  </PrimaryButton>
                </Stack.Item>
              </Stack>
            </Stack>
          </form>
        )}
      </div>
    </div>
  );
};

export default Forgot;
