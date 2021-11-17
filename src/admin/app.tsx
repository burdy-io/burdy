import React from 'react';
import Layout from '@admin/components/layout';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import Authentication from '@admin/features/authentication/pages/auth.page';
import LoadingBar from '@admin/components/loading-bar';
import { SettingsContextProvider } from '@admin/context/settings';
import { initializeFileTypeIcons } from '@fluentui/react-file-type-icons';
import { initializeFolderCovers } from '@fluentui/react-experiments';

import 'react-ace';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-typescript';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-xml';
import 'ace-builds/src-noconflict/mode-text';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/mode-sh';

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
