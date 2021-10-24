import { EntityManager, In } from 'typeorm';
import { IPost } from '@shared/interfaces/model';
import async from 'async';
import { updateMeta } from '@server/common/orm-helpers';
import Post from '@server/models/post.model';
import { createPostVersion } from '@server/controllers/post.controller';
import ContentType from '@server/models/content-type.model';

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
      newParent = await manager.save(Post, {
        parent,
        name: slug,
        type: POST_FOLDER_TYPE,
        slug,
        slugPath,
      });
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
    return;
  }

  if (
    saved?.type === POST_FOLDER_TYPE ||
    (saved &&
      (saved?.contentType?.name !== post.contentType?.name ||
        saved?.type !== post?.type))
  ) {
    return;
  }

  if (saved) {
    await createPostVersion(manager.getRepository(Post), saved, user);
    await updateMeta(manager, Post, saved, post.meta);
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
    author: user,
    meta: (post.meta || []).map((item) => ({
      key: item.key,
      value: item.value,
    })),
  };

  saved = await manager.save(Post, postObj);
  return saved;
};

export const importPosts = async ({
  entityManager,
  posts,
  user,
  options,
}: {
  entityManager: EntityManager;
  posts: IPost[];
  user: any;
  options?: any;
}) => {
  const sorted = (posts || []).sort((a, b) => {
    if (a.slugPath < b.slugPath) {
      return -1;
    }
    if (a.slugPath > b.slugPath) {
      return 1;
    }
    return 0;
  });
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
  return posts;
};
