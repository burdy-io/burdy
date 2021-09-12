import React, { useMemo } from 'react';
import { getTheme, Icon, mergeStyleSets } from '@fluentui/react';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import { Link } from 'react-router-dom';
import Hooks from '@shared/features/hooks';

const theme = getTheme();

export interface IDashboardLink {
  key: string;
  title: string;
  icon: string;
  url: string;
  permissions?: string[];
}

export interface IDashboardSection {
  key: string;
  component: JSX.Element;
  permissions?: string[];
}

const styles = mergeStyleSets({
  panels: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))',
    gridColumnGap: 20,
    margin: '50px auto',
    maxWidth: 720,
    gap: '20px'
  },
  gridItem: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    height: 132,
    width: 132,
    padding: '24px 24px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: theme.effects.elevation8,
    '&:hover': {
      cursor: 'pointer',
      backgroundColor: theme.palette.neutralLighter,
      boxShadow: theme.effects.elevation16
    }
  },
  icon: {
    fontSize: 38,
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.palette.themePrimary
  },
  title: {
    marginBottom: 10,
    fontWeight: 600,
    fontSize: theme.fonts.mediumPlus.fontSize,
    height: 42,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center'
  }
});

const defaultLinks = [
  {
    title: 'Assets',
    key: 'assets',
    icon: 'PhotoVideoMedia',
    url: '/assets',
    permissions: ['assets_list']
  },
  {
    title: 'Sites',
    key: 'sites',
    icon: 'ReopenPages',
    url: '/sites',
    permissions: ['sites_list']
  },
  {
    title: 'Content Type Builder',
    key: 'content-types',
    icon: 'PageHeaderEdit',
    url: '/content-types',
    permissions: ['content_types_list']
  },
  {
    title: 'Tags',
    key: 'tags',
    icon: 'Tag',
    url: '/tags',
    permissions: ['tags_list']
  },
  {
    title: 'Users',
    key: 'users',
    icon: 'People',
    url: '/users',
    permissions: ['users_administration']
  },
  {
    title: 'Settings',
    key: 'settings',
    icon: 'Settings',
    url: '/settings',
    permissions: ['settings']
  }
];

const Dashboard = () => {
  const { filterPermissions } = useAuth();

  const links = useMemo(() => {
    return Hooks.applySyncFilters('dashboard/links', defaultLinks);
  }, []);

  const defaultSection = useMemo(() => {
    return (
      <div className={styles.panels}>
        {filterPermissions(links).map((item) => (
          <div key={item.key} data-cy={`dashboard-${item.key}`} className={styles.gridItem}>
            <Link className={styles.card} to={item.url}>
              <div className={styles.icon}>
                <Icon iconName={item.icon} />
              </div>
              <div className={styles.title}>{item.title}</div>
            </Link>
          </div>
        ))}
      </div>
    );
  }, [links]);

  const sections = useMemo<any[]>(() => {
    return Hooks.applySyncFilters('dashboard/sections', [{
      key: 'default',
      component: defaultSection
    }]);
  }, [defaultSection]);

  return (
    <div style={{ padding: '0 1rem', overflow: 'auto' }}>
      {sections.map(({key, component}) => (
        <section key={key}>{component}</section>))}
    </div>
  );
};

export default Dashboard;
