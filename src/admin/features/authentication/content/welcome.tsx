import React, { useEffect } from 'react';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import {
  makeStyles,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Stack,
  Text
} from '@fluentui/react';
import classNames from 'classnames';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { ControlledTextField } from '@admin/components/rhf-components';
import { yupResolver } from '@hookform/resolvers/yup';
import Validators from '@shared/validators';
import logo from '../../../assets/logo.svg';

const useStyles = makeStyles({
  wrapper: {
    width: 360,
    marginLeft: 'auto !important',
    marginRight: 'auto !important',
    textAlign: 'left',
    marginBottom: '2%'
  },
  container: {
    minHeight: '100vh',
    minWidth: '100vw',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#faf9f8'
  },
  card: {
    marginBottom: '2rem'
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  info: {
    textAlign: 'center',
    marginBottom: '1rem !important'
  },
  button: {
    width: '100%'
  },
  alert: {
    marginBottom: '1rem !important',
    textAlign: 'center'
  },
  logo: {
    margin: '0 auto 0.5rem 0',
    display: 'block'
  }
});

const formSchema = yup.object({
  email: Validators.email(),
  password: Validators.password(),
  firstName: Validators.firstName(),
  lastName: Validators.lastName()
});

const Welcome: React.FC<any> = () => {
  const styles = useStyles();
  const { init } = useAuth();
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: ''
    }
  });

  const submit = handleSubmit((data) => {
    init.execute(data);
  });

  useEffect(() => {
    init.reset();
  }, []);

  return (
    <div className={styles.container}>
      <div className={classNames(styles.wrapper, 'card')}>
        <img
          src={logo}
          width={36}
          height={36}
          alt='Burdy'
          className={styles.logo}
        />
        <Stack tokens={{ childrenGap: 8, padding: '0 0 16px' }}>
          <Text variant='xLargePlus' block>
            Welcome
          </Text>
          <Text variant='medium' block>
            Please fill out the following information to begin.
          </Text>
        </Stack>
        {init.error?.message && (
          <MessageBar
            className={styles.alert}
            messageBarType={MessageBarType.error}
          >
            {init.error.message}
          </MessageBar>
        )}

        <form onSubmit={submit}>
          <Stack tokens={{ childrenGap: 8 }}>
            <Stack tokens={{ childrenGap: 8 }} horizontal>
              <Stack.Item style={{ flexGrow: 1 }}>
                <ControlledTextField
                  control={control}
                  name='firstName'
                  type='text'
                  label='First Name'
                  autoComplete='off'
                  required
                  data-cy="welcome-firstName"
                />
              </Stack.Item>
              <Stack.Item style={{ flexGrow: 1 }}>
                <ControlledTextField
                  style={{ flexGrow: 1 }}
                  control={control}
                  name='lastName'
                  type='text'
                  label='Last Name'
                  autoComplete='off'
                  required
                  data-cy="welcome-lastName"
                />
              </Stack.Item>
            </Stack>
            <ControlledTextField
              control={control}
              name='email'
              type='email'
              label='Email'
              required
              data-cy="welcome-email"
            />
            <ControlledTextField
              control={control}
              name='password'
              type='password'
              label='Password'
              canRevealPassword
              required
              data-cy="welcome-password"
            />
            <Stack.Item align='end'>
              <PrimaryButton
                className={styles.button}
                type='submit'
                disabled={init.loading}
                data-cy="welcome-submit"
              >
                Get Started
              </PrimaryButton>
            </Stack.Item>
          </Stack>
        </form>
      </div>
    </div>
  )
    ;
};

export default Welcome;
