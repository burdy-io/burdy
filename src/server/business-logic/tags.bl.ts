import { EntityManager } from 'typeorm';
import { ITag } from '@shared/interfaces/model';
import async from 'async';
import logger from '@shared/features/logger';
import Tag from '@server/models/tag.model';

export const getParent = async (
  manager: EntityManager,
  components: string[],
  parent?: any
) => {
  if (components.length > 0) {
    let newParent;
    const slug = components.shift();
    const slugPath = parent ? `${parent.slugPath}/${slug}` : slug;
    try {
      newParent = await manager.save(Tag, {
        parent,
        name: slug,
        slug,
        slugPath,
      });
    } catch (err) {
      newParent = await manager.findOne(Tag, {
        slugPath,
      });
    }

    parent = await getParent(manager, components, newParent);
  }

  return parent;
};

export type IImportTags = {
  manager: EntityManager;
  tag: ITag;
  user: any;
  options?: {
    force?: boolean;
  };
};

export const importTag = async ({
  manager,
  tag,
  user
}: IImportTags): Promise<ITag | undefined> => {
  let saved;
  const searchObj: any = {
    slugPath: tag.slugPath,
  };
  logger.info(`Importing ${tag.slugPath}`);

  saved = await manager.findOne(Tag, {
    relations: ['meta', 'author', 'author.meta', 'parent'],
    where: searchObj,
  });

  if (saved) {
    logger.info(`Skipping ${tag.slugPath}, exists.`);
    return;
  }

  let parent;
  const slugComponents = tag.slugPath
    .split('/')
    .filter((cmp) => cmp?.length > 0);
  slugComponents.pop();
  if (slugComponents.length > 0) {
    parent = await getParent(manager, slugComponents);
  }

  const tagObj: any = {
    name: tag.name,
    slug: tag.slug,
    slugPath: tag.slugPath,
    parent,
    author: user,
  };

  saved = await manager.save(Tag, tagObj);
  logger.info(`Created new tag ${tag.slugPath}.`);
  return saved;
};

export const importTags = async ({
  entityManager,
  tags,
  user,
  options,
}: {
  entityManager: EntityManager;
  tags: ITag[];
  user: any;
  options?: any;
}) => {
  const sorted = (tags || []).sort((a, b) => {
    if (a.slugPath < b.slugPath) {
      return -1;
    }
    if (a.slugPath > b.slugPath) {
      return 1;
    }
    return 0;
  });
  if (sorted?.length > 0) {
    logger.info('Importing tags.');
  }
  await async.eachLimit(sorted, 1, async (item, next) => {
    try {
      await importTag({
        manager: entityManager,
        user,
        tag: item,
        options,
      });
      next();
    } catch (e) {
      next(e);
    }
  });
  if (sorted?.length > 0) {
    logger.info('Importing tags successful.');
  }
};

export const exportTags = async ({
  entityManager,
}: {
  entityManager: EntityManager;
}): Promise<ITag[]> => {
  const tagRepository = entityManager.getRepository(Tag);
  const tags = await tagRepository.find();
  return tags;
};
