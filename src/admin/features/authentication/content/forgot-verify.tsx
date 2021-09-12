import { Link } from '@admin/components/links';
import React, { useEffect } from 'react';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import * as yup from 'yup';
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
import { useParams } from 'react-router';
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
  password: yup.string().min(6).required().label('Password'),
  confirmPassword: yup
    .string()
    .min(6)
    .required()
    .oneOf([yup.ref('password'), null], 'Passwords must match.')
    .label('Confirm password'),
});

const ForgotVerify: React.FC<any> = () => {
  const styles = useStyles();
  const { forgotVerify } = useAuth();
  const { token } = useParams<any>();
  const { control, handleSubmit, setValue } = useForm({
    resolver: yupResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      token,
    },
  });

  const submit = handleSubmit((data) => {
    forgotVerify.execute(data);
  });

  useEffect(() => {
    setValue('token', token);
  }, [token]);

  return (
    <>
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
              Enter your new password.
            </Text>
          </Stack>
          {forgotVerify.error?.message && (
            <>
              <MessageBar
                className={styles.alert}
                messageBarType={MessageBarType.error}
              >
                {forgotVerify.error.message}
              </MessageBar>
            </>
          )}
          {forgotVerify.status === 'success' ? (
            <>
              <MessageBar
                className={styles.alert}
                messageBarType={MessageBarType.success}
              >
                Your password has been reset.
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
                  name="password"
                  type="password"
                  label="Password"
                  canRevealPassword
                  required
                />
                <ControlledTextField
                  control={control}
                  name="confirmPassword"
                  type="password"
                  label="Confirm Password"
                  canRevealPassword
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
                      disabled={forgotVerify.loading}
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
    </>
  );
};

export default ForgotVerify;
