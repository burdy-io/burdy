import React from 'react';
import LogIn from '@admin/features/authentication/content/login';
import RedirectAuth from '@admin/features/authentication/components/redirect-auth';
import Forgot from '@admin/features/authentication/content/forgot';
import ForgotVerify from '@admin/features/authentication/content/forgot-verify';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import Welcome from '@admin/features/authentication/content/welcome';
import {Redirect, Route, Switch, useLocation} from 'react-router';

const Authentication = () => {
  const { needsInit } = useAuth();

  return (
    <Switch>
      {needsInit && [<Route path="/init" component={Welcome} exact />]}
      {!needsInit && [
        <Route path="/login" component={LogIn} exact />,
        <Route path="/forgot" component={Forgot} exact />,
        <Route path="/forgot-verify/:token" component={ForgotVerify} exact />,
      ]}
      <Route path="*" component={RedirectAuth} />
    </Switch>
  );
};

export default Authentication;
