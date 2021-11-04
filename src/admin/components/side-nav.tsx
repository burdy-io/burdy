import React, { useEffect, useMemo } from 'react';
import { INavLinkGroup, makeStyles, Nav, NeutralColors } from '@fluentui/react';
import { useHistory, useLocation } from 'react-router';
import { useSettings } from '@admin/context/settings';
import { useStorageState } from '@admin/helpers/hooks';
import Hooks from '@shared/features/hooks';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import {Link} from "react-router-dom";

const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflowY: 'auto',
    '& .ms-Nav': {
      overflowX: 'hidden'
    }
  },
  grow: {
    flexGrow: 1,
  },
});

const SideNav = () => {
  const classNames = useStyles();
  const { getContentTypes } = useSettings();
  const { filterPermissions } = useAuth();
  const location = useLocation();
  const [expandedLinks, setExpandedLinks] = useStorageState<any>(
    'sideMenu-navExpanded',
    {}
  );

  useEffect(() => {
    getContentTypes.execute({
      type: 'post',
    });
  }, []);

  const NavLink = ({defaultRender: DefaultRenderer, href, ...props}) => href ? (
    <Link to={href}>
      <DefaultRenderer {...props as any} />
    </Link>
  ) : <DefaultRenderer {...props} />

  const groups = useMemo<INavLinkGroup[]>(() => {
    const tmpGroups = [];

    tmpGroups.push({
      links: filterPermissions([
        {
          url: '/',
          key: 'dashboard',
          'data-cy': 'nav-dashboard',
          name: 'Dashboard',
        },
        {
          url: '/assets',
          key: 'assets',
          'data-cy': 'nav-assets',
          name: 'Assets',
          permissions: ['assets_list'],
        },
        {
          url: '/sites',
          key: 'sites',
          'data-cy': 'nav-sites',
          name: `Sites`,
          permissions: ['sites_list'],
        },
        {
          url: '/content-types',
          key: 'content-types',
          'data-cy': 'nav-content-types',
          name: 'Content Types',
          permissions: ['content_types_list'],
        },
        {
          url: '/tags',
          key: 'tags',
          name: `Tags`,
          permissions: ['tags_list'],
        },
      ]),
    });

    tmpGroups.push({
      links: filterPermissions([
        {
          url: '/users',
          key: 'users',
          name: 'Users',
        },
        {
          url: '/settings',
          key: 'settings',
          name: 'Settings',
          permissions: ['settings'],
        },
      ]),
    });

    return Hooks.applySyncFilters('admin/sidenav', tmpGroups);
  }, [getContentTypes?.result, expandedLinks]);

  const selectedKey = useMemo(() => {
    if (location.pathname.includes('/sites')) {
      return 'sites';
    }

    const flatLinks = groups.flatMap((g) => g.links);

    return (
      flatLinks
        .filter((p) => p.url === location.pathname)
        .map((p) => p.key)?.[0] ??
      flatLinks
        .filter((p) => location.pathname.includes(p.url))
        .sort((a, b) => b.url.length - a.url.length)
        .map((p) => p.key)?.[0] ??
      undefined
    );
  }, [location, groups]);

  const handleLinkExpandClick = (e, item) => {
    setExpandedLinks({
      ...expandedLinks,
      [item.key]: !item.isExpanded,
    });
  };

  return (
    <div className={classNames.wrapper}>
      <Nav
        groups={groups}
        onLinkExpandClick={handleLinkExpandClick}
        styles={{
          link: {
            background: NeutralColors.gray20,
            '.ms-Nav-compositeLink:hover &': {
              background: NeutralColors.gray30,
            },
            '.ms-Nav-compositeLink.is-selected &': {
              background: NeutralColors.gray40,
            },
          },
        }}
        linkAs={NavLink}
        selectedKey={selectedKey}
      />
    </div>
  );
};

export default SideNav;
