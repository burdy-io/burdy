import { EntityManager, In } from 'typeorm';
import { IPost } from '@shared/interfaces/model';
import async from 'async';
import { updateMeta } from '@server/common/orm-helpers';
import Post from '@server/models/post.model';
import { createPostVersion } from '@server/controllers/post.controller';
import ContentType from '@server/models/content-type.model';
import logger from '@shared/features/logger';
import { importTag } from '@server/business-logic/tags.bl';
import {mapPost} from "@server/common/mappers";

const POST_FOLDER_TYPE = 'folder';

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
      newParent = await manager.findOne(Post,{
        slugPath
      });

      if (!newParent) {
        newParent = await manager.save(Post, {
          parent,
          name: slug,
          type: POST_FOLDER_TYPE,
          slug,
          slugPath,
        });
      }
    } catch (err) {
      newParent = await manager.findOne(Post, {
        slugPath,
      });
    }

    parent = await getParent(manager, components, newParent);
  }

  return parent;
};

export type IImportPosts = {
  manager: EntityManager;
  post: IPost;
  user: any;
  options?: {
    force?: boolean;
  };
};

export const importPost = async ({
  manager,
  post,
  user,
  options,
}: IImportPosts): Promise<IPost | undefined> => {
  let saved;
  const searchObj: any = {
    slugPath: post.slugPath,
  };
  logger.info(`Importing ${post.slugPath}`);

  saved = await manager.findOne(Post, {
    relations: [
      'meta',
      'contentType',
      'author',
      'author.meta',
      'parent',
      'tags',
    ],
    where: searchObj,
  });

  if (saved && !options?.force) {
    logger.info(`Skipping ${post.slugPath}, exists.`);
    return saved;
  }

  if (
    saved?.type === POST_FOLDER_TYPE ||
    (saved &&
      (saved?.contentType?.name !== post.contentType?.name ||
        saved?.type !== post?.type))
  ) {
    logger.info(`Skipping ${post.slugPath}, existing post either of type "folder" or not matching contentType.`);
    return saved;
  }

  let tags;
  if (post?.tags?.length > 0) {
    tags = await Promise.all(post?.tags.map(async(tag) => {
      const imported = await importTag({
        manager,
        tag,
        user
      });
      return imported;
    }));
  }

  if (saved) {
    await createPostVersion(manager.getRepository(Post), saved, user);
    await updateMeta(manager, Post, saved, post.meta);
    if (tags?.length > 0) {
      saved.tags = tags;
      await manager.save(Post, saved);
    }
    logger.info(`Updating existing post ${post.slugPath} success.`);
    return saved;
  }

  let contentType;
  if (post?.type !== POST_FOLDER_TYPE) {
    contentType = await manager.findOne(ContentType, {
      where: {
        name: post?.contentType?.name,
      },
    });
  }

  if (!contentType && post?.type !== POST_FOLDER_TYPE) {
    contentType = await manager.save(ContentType, {
      name: post?.contentType?.name,
      type: post?.contentType?.type,
      author: user,
      fields: JSON.stringify(post?.contentType?.fields || []),
    });
  }

  let parent;
  const slugComponents = post.slugPath
    .split('/')
    .filter((cmp) => cmp?.length > 0);
  slugComponents.pop();
  if (slugComponents.length > 0) {
    parent = await getParent(manager, slugComponents);
  }

  const postObj: any = {
    name: post.name,
    slug: post.slug,
    slugPath: post.slugPath,
    type: post.type,
    contentType,
    parent,
    tags,
    author: user,
    meta: (post.meta || []).map((item) => ({
      key: item.key,
      value: item.value,
    })),
  };

  saved = await manager.save(Post, postObj);
  logger.info(`Created new post ${post.slugPath}.`);
  return saved;
};

export const importPosts = async ({
  entityManager,
  data,
  user,
  options,
}: {
  entityManager: EntityManager;
  data: IPost[];
  user: any;
  options?: any;
}) => {
  const sorted = (data || []).sort((a, b) => {
    if (a.slugPath < b.slugPath) {
      return -1;
    }
    if (a.slugPath > b.slugPath) {
      return 1;
    }
    return 0;
  });
  if (sorted?.length > 0) {
    logger.info('Importing posts.');
  }
  await async.eachLimit(sorted, 1, async (item, next) => {
    try {
      await importPost({
        manager: entityManager,
        user,
        post: item,
        options,
      });
      next();
    } catch (e) {
      next(e);
    }
  });
  if (sorted?.length > 0) {
    logger.info('Importing posts successful.');
  }
};

export const exportPosts = async ({
  entityManager,
}: {
  entityManager: EntityManager;
}): Promise<IPost[]> => {
  const postRepository = entityManager.getRepository(Post);
  const posts = await postRepository.find({
    relations: ['contentType', 'tags', 'meta'],
    where: {
      type: In(['post', 'page', 'hierarchical_post', 'fragment', 'folder']),
    },
  });

  return posts.map(mapPost);
};
