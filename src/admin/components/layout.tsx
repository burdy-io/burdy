import React, { useMemo } from 'react';
import SideNav from '@admin/components/side-nav';
import Header from '@admin/components/header';
import { Redirect, Route, Switch } from 'react-router';
import PostsPage from '@admin/features/posts/pages/posts.page';
import SitesPage from '@admin/features/posts/pages/sites.page';
import HeadlessEditorPage from '@admin/features/editor/pages/headless.page';
import TagsPage from '@admin/features/tags/pages/tags.page';
import Dashboard from '@admin/features/dashboard';
import AssetsPage from '@admin/features/assets/pages/assets.page';
import ContentTypes from '@admin/features/content-types/pages/content-types.page';
import UsersPage from '@admin/features/users/pages/users.page';
import Settings from '@admin/features/settings/pages/settings.page';
import Hooks from '@shared/features/hooks';
import { makeStyles, NeutralColors } from '@fluentui/react';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import ErrorBoundary from '@admin/components/error-boundary';

const useStyles = makeStyles({
  layout: {
    display: 'grid',
    gridAutoFlow: 'column',
    gridTemplateColumns: 'auto 1fr',
    height: '100vh'
  },
  header: {
    position: 'fixed !important' as any,
    top: 0,
    left: 0,
    right: 0,
    paddingLeft: '0 !important',
    paddingRight: '0 !important',
    zIndex: 14
  },
  sider: {
    position: 'fixed !important' as any,
    top: 48,
    bottom: 0,
    left: 0,
    background: NeutralColors.gray20,
    width: 200,
    zIndex: 10
  },
  content: {
    padding: '48px 0 0 200px',
    transition: '.2s padding ease-in-out',
    height: 'calc(100vh - 48px)',
    overflow: 'hidden',
    '&:global(.menuCollapsed)': {
      padding: '48px 0 0 80px'
    }
  },
  innerContent: {
    height: '100%'
  }
});

const Layout = () => {
  const styles = useStyles();
  const { filterPermissions } = useAuth();
  const routes = useMemo(() => {
    const predefined = [
      {
        exact: true,
        key: 'dashboard',
        path: '/',
        component: Dashboard
      },
      {
        key: 'assets',
        path: '/assets',
        component: AssetsPage,
        permissions: ['assets_list']
      },
      {
        key: 'content-types',
        path: '/content-types',
        component: ContentTypes,
        permissions: ['content_types_list']
      },
      {
        key: 'users',
        path: '/users',
        component: UsersPage,
      },
      {
        key: 'settings',
        path: '/settings',
        component: Settings,
        permissions: ['settings']
      },
      {
        key: 'sites-editor',
        path: '/sites/editor/:postId',
        component: HeadlessEditorPage,
        permissions: ['sites_update']
      },
      {
        key: 'sites',
        path: '/sites',
        component: SitesPage,
        permissions: ['sites_list']
      },
      {
        key: 'posts-editor',
        path: '/posts/:contentTypeId/editor/:postId',
        component: HeadlessEditorPage,
        permissions: ['posts_update']
      },
      {
        key: 'posts',
        path: '/posts/:contentTypeId',
        component: PostsPage,
        permissions: ['posts_list']
      },
      {
        key: 'tags',
        path: '/tags',
        component: TagsPage,
        permissions: ['tags_list']
      }
    ];
    return filterPermissions(
      Hooks.applySyncFilters('admin/routes', predefined) || []
    );
  }, []);

  return (
    <div>
      <div className={styles.header}>
        <Header />
      </div>
      <div className={styles.sider}>
        <SideNav />
      </div>
      <div className={styles.content}>
        <div className={styles.innerContent}>
          <Switch>
            {routes.map((route) => {
              return (
                <Route
                  exact={route.exact}
                  path={route.path}
                  key={route.key}
                  render={() => (
                    <ErrorBoundary message={`Page ${route.path} errored. Please check console for more details.`}>
                      <route.component />
                    </ErrorBoundary>
                  )}
                />
              );
            })}
            <Redirect from='*' to='' />
          </Switch>
        </div>
      </div>
    </div>
  );
};

export default Layout;
