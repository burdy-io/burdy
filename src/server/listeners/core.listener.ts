import Hooks from '@shared/features/hooks';
import SiteSettings from '@server/models/site-settings.model';
import Group from '@server/models/group.model';
import { getEnhancedRepository } from '@server/common/orm-helpers';

Hooks.addAction(
  'core/init',
  async () => {
    const siteRepository = getEnhancedRepository(SiteSettings);

    try {
      await siteRepository.findOneOrFail({ where: { key: 'firstInit' } });
    } catch (e) {
      await Hooks.doAction('core/firstInit');
      await siteRepository.insert({ key: 'firstInit', value: true as any });
    }
  },
  { id: 'core/init.checkIfFirst' }
);

Hooks.addAction(
  'core/firstInit',
  async () => {
    try {
      const groupRepository = getEnhancedRepository(Group);
      await groupRepository.insert([
        {
          name: 'Admin',
          permissions: ['all'],
          description:
            'Role that enables access to every resource. Protected and therefore, cannot be edited.',
          protected: true,
        },
        {
          name: 'User',
          permissions: [],
          description:
            'Role which allows customers to have access to basic resources (such as authentication).',
          protected: false,
        },
      ]);
    } catch (e) {
      console.log('Error initializing default entries.');
    }
  },
  { id: 'core/firstInit.createGroups' }
);
