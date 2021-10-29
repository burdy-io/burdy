import React from 'react';
import LogIn from '@admin/features/authentication/content/login';
import RedirectAuth from '@admin/features/authentication/components/redirect-auth';
import Forgot from '@admin/features/authentication/content/forgot';
import ForgotVerify from '@admin/features/authentication/content/forgot-verify';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import Welcome from '@admin/features/authentication/content/welcome';
import {Route, Switch} from 'react-router';

const Authentication = () => {
  const { authStatus } = useAuth();

  return (
    <Switch>
      {authStatus === 'needs-init' && [<Route path="/init" component={Welcome} exact />]}
      {authStatus === 'unauthenticated' && [
        <Route path="/login" component={LogIn} exact />,
        <Route path="/forgot" component={Forgot} exact />,
        <Route path="/forgot-verify/:token" component={ForgotVerify} exact />,
      ]}
      <Route path="*" component={RedirectAuth} />
    </Switch>
  );
};

export default Authentication;
