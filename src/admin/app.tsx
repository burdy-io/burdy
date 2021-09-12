import React from 'react';
import Layout from '@admin/components/layout';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import Authentication from '@admin/features/authentication/pages/auth.page';
import LoadingBar from '@admin/components/loading-bar';
import { SettingsContextProvider } from '@admin/context/settings';
import { initializeFileTypeIcons } from '@fluentui/react-file-type-icons';
import { initializeFolderCovers } from '@fluentui/react-experiments';

initializeFileTypeIcons();
initializeFolderCovers();

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingBar />;
  }

  if (!user) {
    return <Authentication />;
  }

  return (
    <SettingsContextProvider>
      <Layout />
    </SettingsContextProvider>
  );
};

export default App;
