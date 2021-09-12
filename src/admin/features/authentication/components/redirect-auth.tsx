import React, { useEffect } from 'react';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import { useHistory } from 'react-router';

const RedirectAuth: React.FC<any> = () => {
  const { needsInit } = useAuth();
  const history = useHistory();

  useEffect(() => {
    if (needsInit) {
      history.replace('/init');
    } else {
      history.replace('/login');
    }
  }, [needsInit]);

  return <></>;
};

export default RedirectAuth;
