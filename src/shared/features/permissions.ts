import Hooks from './hooks';
import { IPermission } from '../interfaces/permissions';
import { IUser } from '@shared/interfaces/model';
import _ from 'lodash';

const DefaultPermissions: IPermission[] = [
  {
    id: 'general',
    name: 'General',
    children: [
      {
        id: 'admin_panel',
        name: 'Access admin panel',
      },
      {
        id: 'settings',
        name: 'Update settings',
      },
      {
        id: 'users_administration',
        name: 'Manage users and groups',
      },
    ],
  },
  {
    id: 'content_types',
    name: 'Content Types',
    children: [
      {
        id: 'content_types_list',
        name: 'List content types',
      },
      {
        id: 'content_types_create',
        name: 'Create content types',
      },
      {
        id: 'content_types_update',
        name: 'Update content types',
      },
      {
        id: 'content_types_delete',
        name: 'Delete content types',
      },
    ],
  },
  {
    id: 'sites',
    name: 'Sites',
    children: [
      {
        id: 'sites_list',
        name: 'List sites/pages/posts/fragments',
      },
      {
        id: 'sites_create',
        name: 'Create sites/pages/posts/fragments',
      },
      {
        id: 'sites_update',
        name: 'Update sites/pages/posts/fragments',
      },
      {
        id: 'sites_publish',
        name: 'Publish/Unpublish sites/pages/posts/fragments',
      },
      {
        id: 'sites_delete',
        name: 'Delete sites/pages/posts/fragments',
      },
    ],
  },
  {
    id: 'assets',
    name: 'Assets',
    children: [
      {
        id: 'assets_list',
        name: 'List assets',
      },
      {
        id: 'assets_create',
        name: 'Create assets',
      },
      {
        id: 'assets_update',
        name: 'Update assets',
      },
      {
        id: 'assets_delete',
        name: 'Delete assets',
      },
    ],
  },
  {
    id: 'tags',
    name: 'Tags',
    children: [
      {
        id: 'tags_list',
        name: 'List tags',
      },
      {
        id: 'tags_create',
        name: 'Create tag',
      },
      {
        id: 'tags_update',
        name: 'Update tag',
      },
      {
        id: 'tags_delete',
        name: 'Delete tags',
      },
    ],
  },
];

const getPermissions = async () => {
  return Hooks.applyFilters('permissions/getAll', DefaultPermissions);
};

const hasPermissions = (user: IUser, permissions: string[]) => {
  const userPermissions = _.flatMap(user?.groups ?? [], 'permissions');
  return permissions.some((permission) => userPermissions.includes(permission));
}
export { getPermissions, hasPermissions };
