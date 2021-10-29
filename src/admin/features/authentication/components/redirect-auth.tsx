import React, { useEffect } from 'react';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import { useHistory } from 'react-router';

const RedirectAuth: React.FC<any> = () => {
  const history = useHistory();
  const { authStatus } = useAuth();
  console.log(authStatus);

  useEffect(() => {
    switch (authStatus) {
      case 'authenticated':
        break;
      case 'needs-init':
        history.replace('/init');
        break;
      case 'unauthenticated':
      default:
        history.replace('/login')
        break;
    }
  }, [authStatus]);

  return <></>;
};

export default RedirectAuth;
