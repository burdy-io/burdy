import React from 'react';
import Heading from '@admin/components/heading';
import { composeWrappers } from '@admin/helpers/hoc';
import AccessTokensCommandBar from '@admin/features/api-security/components/access-tokens-command-bar';
import AccessTokensList from '@admin/features/api-security/components/access-tokens-list';
import { ApiSecurityContextProvider } from '@admin/features/api-security/context/api-security.context';
import ApiAccessSettings from '@admin/features/api-security/components/api-access';

const ApiSettings = () => {
  return (
    <div>
      <Heading title="API Visibility" noPadding>
        Using sitemap/search API always requires accessToken
      </Heading>
      <ApiAccessSettings />

      <Heading title="Access Tokens" noPadding>
        Generate and delete access tokens which are used to get posts content
        and search for posts
      </Heading>
      <AccessTokensCommandBar />
      <AccessTokensList />
    </div>
  );
};

export default composeWrappers({
  apiSecurityContext: ApiSecurityContextProvider,
})(ApiSettings);
