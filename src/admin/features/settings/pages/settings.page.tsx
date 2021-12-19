import { Pivot, PivotItem } from '@fluentui/react';
import React, { useMemo } from 'react';
import GroupSettings from '@admin/features/settings/tabs/groups.tab';
import { useHistory, useRouteMatch } from 'react-router';
import GeneralSettings from '@admin/features/settings/tabs/general.tab';
import Hooks from '@shared/features/hooks';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import ErrorBoundary from '@admin/components/error-boundary';
import BackupSettings from "@admin/features/settings/tabs/backup.tab";
import ApiSettings from '@admin/features/settings/tabs/api.tab';
import PreviewEditorTab from '@admin/features/settings/tabs/preview.tab';

const Settings = () => {
  const history = useHistory();
  const { params } = useRouteMatch<any>('/settings/:id?');
  const { filterPermissions } = useAuth();

  const items = useMemo(() => {
    const predefined = [
      {
        key: 'general',
        name: 'General',
        permissions: ['settings'],
        component: GeneralSettings
      },
      {
        key: 'backups',
        name: 'Backups',
        permissions: ['all'],
        component: BackupSettings,
      },
      {
        key: 'groups',
        name: 'Groups',
        permissions: ['users_administration'],
        component: GroupSettings
      },
      {
        key: 'api',
        name: 'Api & Security',
        permissions: ['all'],
        component: ApiSettings
      },
      {
        key: 'preview-editor',
        name: 'Preview Editor',
        permissions: ['all'],
        component: PreviewEditorTab
      }
    ];

    return filterPermissions(
      Hooks.applySyncFilters('admin/settings/tabs', predefined)
    );
  }, []);

  return (
    <div style={{ padding: '1rem 2rem' }}>
      <Pivot
        aria-label='Settings pivot'
        selectedKey={params?.id ?? 'general'}
        onLinkClick={(item) => history.push(`/settings/${item.props.itemKey}`)}
      >
        {items.map((item) => (
          <PivotItem key={item.key} headerText={item.name} itemKey={item.key}>
            <ErrorBoundary message={`Page ${item.name} errored. Please check console for more details.`}>
              {item?.component && <item.component />}
            </ErrorBoundary>
          </PivotItem>
        ))}
      </Pivot>
    </div>
  );
};

export default Settings;
