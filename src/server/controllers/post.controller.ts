import express from 'express';
import { endOfDay, isAfter, isBefore } from 'date-fns';
import authMiddleware from '@server/middleware/auth.middleware';
import asyncMiddleware from '@server/middleware/async.middleware';
import { Brackets, getManager, getRepository, In, Repository } from 'typeorm';
import * as yup from 'yup';
import BadRequestError from '@server/errors/bad-request-error';
import Post from '@server/models/post.model';
import ContentType from '@server/models/content-type.model';
import { flatten } from '@server/common/object';
import logger from '@shared/features/logger';
import Tag from '@server/models/tag.model';
import { IPost, IUser } from '@shared/interfaces/model';
import {
  getReplaceChildrenQuery,
  updateMeta
} from '@server/common/orm-helpers';
import { v4 as uuidv4 } from 'uuid';
import { mapPost, mapPostWithMeta } from '@server/common/mappers';
import { compilePost, retrievePostAndCompile } from '@server/common/post.utility';
import { sign, verify } from '@server/common/jwt';
import Hooks from '@shared/features/hooks';
import queryString from 'query-string';

const app = express();

export const isPostPublished = (post?: IPost) => {
  if (post?.status === 'published') {
    if (post?.publishedFrom && isBefore(new Date(), new Date(post?.publishedFrom))) {
      return false;
    }
    if (post?.publishedUntil && isAfter(new Date(), new Date(post?.publishedUntil))) {
      return false;
    }
    return true;
  }
  return false;
}

export const createPostVersion = async (
  postRepository: Repository<Post>,
  post: IPost,
  author: IUser
): Promise<IPost> => {
  const postVersion = await postRepository.save({
    type: 'post_version',
    name: post.name,
    slug: uuidv4(),
    slugPath: uuidv4(),
    contentType: post.contentType,
    meta: (post.meta || []).map((meta) => ({
      key: meta?.key,
      value: meta?.value
    })),
    tags: post.tags,
    author,
    parent: post
  });
  return postVersion;
};

app.get(
  '/posts',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const contentTypeId = req?.query?.contentTypeId;
    const contentTypeName = req?.query?.contentTypeName;
    const type = req?.query?.type;
    const id = req?.query?.id;
    const search = req?.query?.search;
    const parentId = req?.query?.parentId;
    const onlyOrphans = req?.query?.onlyOrphans;
    const slug = req?.query?.slug;

    const postRepository = getRepository(Post);

    const qb = postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.contentType', 'contentType')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.tags', 'tags')
      .leftJoinAndSelect('author.meta', 'author.meta')
      .where('post.type != :postVersion', {
        postVersion: 'post_version'
      });

    if (id) {
      qb.andWhere('post.id IN (:...ids)', {
        ids: (id as string).split(',')
      });
    }

    if (slug) {
      qb.andWhere('post.slugPath IN (:...slugPaths)', {
        slugPaths: (slug as string).split(','),
      })
    }

    if (type) {
      qb.andWhere('post.type IN (:...types)', {
        types: (type as string).split(',')
      });
    }

    if (contentTypeId) {
      qb.andWhere('post.contentTypeId IN (:...ids)', {
        ids: (contentTypeId as string).split(',')
      });
    }

    if (contentTypeName) {
      qb.andWhere('contentType.name IN (:...name)', {
        name: (contentTypeName as string).split(',')
      });
    }

    if (parentId && !onlyOrphans) {
      qb.andWhere('post.parentId IN (:...parentIds)', {
        parentIds: (parentId as string).split(',')
      });
    }

    if (onlyOrphans) {
      qb.andWhere('post.parentId IS NULL');
    }

    if (search?.length > 0) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('LOWER(post.name) LIKE :search', {
              search: `%${(search as string).toLowerCase()}%`
            })
            .orWhere('LOWER(post.slugPath) LIKE :search', {
              search: `%${(search as string).toLowerCase()}%`
            });
        })
      );
    }

    const posts = await qb.addOrderBy('post.updatedAt', 'DESC').getMany();

    res.send(posts.map(mapPost));
  })
);

app.post(
  '/posts',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    await req.validate(
      {
        slug: yup.string().max(256).required(),
        name: yup.string().max(256).required()
      },
      'body'
    );

    const entityManager = getManager();
    const params = req.body;

    let post;

    try {
      await entityManager.transaction(async (transactionManager) => {
        let parent;
        if (params.parentId) {
          parent = await transactionManager.findOne(Post, {
            id: params.parentId
          });
          if (!parent) throw new BadRequestError('invalid_parent');
        }

        let contentType;
        if (params.contentTypeId) {
          contentType = await transactionManager.findOne(ContentType, {
            where: {
              id: params.contentTypeId,
              type: In(['post', 'page', 'fragment'])
            }
          });
          if (!contentType) throw new BadRequestError('invalid_content_type');
        }

        let meta = [];
        if (params.meta) {
          meta = Object.entries(params.meta).map(([key, value]) => ({ key, value }));
        }

        const postObj: Partial<IPost> = {
          name: params.name,
          slug: params.slug,
          type: params?.type || 'post',
          contentType,
          author: req?.data?.user,
          meta
        };

        if(postObj.type === 'folder') {
          postObj.status = 'published';
        }

        if (parent) {
          postObj.parent = parent;
          postObj.slugPath = `${parent.slugPath}/${params.slug}`;
        } else {
          postObj.slugPath = params.slug;
        }

        post = await transactionManager.save(Post, postObj);
      });
    } catch (err) {
      logger.error({
        type: 'post',
        message: 'error saving post',
        data: err.toString()
      });
      if (err?.code === '23505') {
        throw new BadRequestError('duplicate_slug');
      }
      throw err;
    }
    return res.send(mapPost(post));
  })
);

app.post(
  '/posts/:postId/copy',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    await req.validate(
      {
        slug: yup.string().max(256).required(),
        name: yup.string().max(256).required()
      },
      'body'
    );

    const entityManager = getManager();
    const { parentId, recursive, name, slug } = req.body;
    const { postId } = req.params;

    const posts: IPost[] = [];
    try {
      await entityManager.transaction(async (transactionManager) => {
        let parent;
        if (parentId) {
          parent = await transactionManager.findOne(Post, {
            id: parentId
          });
          if (!parent) throw new BadRequestError('invalid_parent');
        }

        const sourcePost = await transactionManager.findOne(Post, {
          relations: ['meta', 'contentType', 'parent'],
          where: {
            id: postId
          }
        });
        if (!sourcePost) throw new BadRequestError('invalid_source');

        let children: any = [sourcePost];
        if (recursive) {
          children = await transactionManager.getRepository(Post)
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.contentType', 'contentType')
            .leftJoinAndSelect('post.meta', 'meta')
            .leftJoinAndSelect('post.tags', 'tags')
            .where('post.type IN (:...types)', {
              types: ['folder', 'page', 'fragment', 'post', 'hierarchical_post']
            })
            .andWhere(new Brackets((subQb) => {
              subQb
                .where('post.slugPath = :slugPath1', {
                  slugPath1: sourcePost.slugPath
                })
                .orWhere('post.slugPath LIKE :slugPath2', {
                  slugPath2: `${sourcePost.slugPath}/%`
                });
            })).addOrderBy('post.slugPath', 'ASC').getMany();
        }

        const getSlugPath = (child) => {
          const newKey =
            `${parent ? `${parent?.slugPath}/` : ''}${slug}${child.slugPath.slice(sourcePost?.slugPath?.length || 0)}`;
          return newKey;
        };
        const getParent = (child, slugPath) => {
          const components = slugPath.split('/');
          components.pop();
          return posts.find(post => post.slugPath === components.join('/'));
        };
        await children.reduce(async (promise, child) => {
          await promise;
          const slugPath = getSlugPath(child);
          const postObj: any = {
            type: child?.type,
            name: sourcePost.id === child.id ? name : child?.name,
            slug: sourcePost.id === child.id ? slug : child?.slug,
            slugPath,
            contentType: child?.contentType,
            meta: (child.meta || []).map((meta) => ({
              key: meta?.key,
              value: meta?.value
            })),
            parent: sourcePost.id === child.id ? parent : getParent(child, slugPath),
            tags: child.tags,
            author: req?.data?.user
          };
          const post = await transactionManager.save(Post, postObj);
          posts.push(post);
        }, Promise.resolve());
      });
    } catch (err) {
      logger.error({
        type: 'post',
        message: 'error saving post',
        data: err.toString()
      });
      throw new BadRequestError('duplicate_slug');
    }
    return res.send(posts.map(post => mapPost(post)));
  })
);

app.delete(
  '/posts',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const ids: number[] = req?.body ?? [];
    if (!ids || ids?.length === 0) return res.send([]);

    const postRepository = getRepository(Post);
    const deleted = await postRepository.delete({
      id: In(ids)
    });

    return res.send(deleted);
  })
);

app.put(
  '/posts/:postId/content',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const entityManager = getManager();
    let post: IPost;
    try {
      await entityManager.transaction(async (transactionManager) => {
        const postRepository = transactionManager.getRepository(Post);

        post = await postRepository.findOne({
          relations: [
            'meta',
            'contentType',
            'author',
            'author.meta',
            'parent',
            'tags'
          ],
          where: {
            id: req.params.postId
          }
        });
        if (!post) throw new BadRequestError('invalid_post');

        await createPostVersion(
          transactionManager.getRepository(Post),
          post,
          req?.data?.user
        );

        const flat = flatten(req?.body);

        await updateMeta(
          transactionManager,
          Post,
          post,
          Object.keys(flat).map((key) => ({
            key: `content.${key}`,
            value: flat[key]
          })),
          /^content/
        );

        post.author = req?.data?.user;
        post.updatedAt = new Date();

        await postRepository.save(post);
      });
    } catch (err) {
      if (err?.code === '23505') {
        throw new BadRequestError('duplicate_slug');
      }
      logger.error({
        type: 'post',
        message: 'error saving post content',
        data: err.toString()
      });
      throw err;
    }

    res.send(mapPostWithMeta(post));
  })
);

app.put(
  `/posts/publish`,
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const { publish, recursive, ids, publishedFrom, publishedUntil } = req.body;
    const entityManager = getManager();
    try {
      const result = await entityManager.transaction(async (transactionManager) => {
        const postRepository = transactionManager.getRepository(Post);
        const postTreeRepository = transactionManager.getTreeRepository(Post);

        let posts = await postRepository.findByIds(ids);
        if (!(posts?.length > 0)) throw new BadRequestError('invalid_ids');

        const qb = postRepository.createQueryBuilder('post').update(Post);
        const now = new Date();
        if (publish) {
          qb.set({
            publishedAt: now,
            status: 'published',
            publishedFrom: publishedFrom || now,
            publishedUntil: publishedUntil ? endOfDay(
              new Date(publishedUntil),
            ) : null,
            updatedAt: now
          });
        } else {
          qb.set({
            publishedAt: null,
            status: 'draft',
            publishedFrom: null,
            publishedUntil: null,
            updatedAt: now
          });
        }

        if (recursive) {
          const all = [];
          await Promise.all(posts.map(async (post) => {
            const descendants = await postTreeRepository.findDescendants(post);
            descendants.forEach(descendant => {
              all.push(descendant);
            })
          }));
          qb.where('post.id IN (:...ids)', { ids: all.map(post => post.id) });
        } else {
          qb.where('post.id IN (:...ids)', { ids: posts.map(post => post.id) });
        }

        await qb.execute();
        posts = await postRepository.findByIds(ids);
        return posts;
      });
      res.send(result);
    } catch (err) {
      logger.error({
        type: 'post',
        message: 'error saving post',
        data: err.toString()
      });
      throw err;
    }
  })
);

app.put(
  '/posts/:postId',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const entityManager = getManager();
    let post;
    try {
      await entityManager.transaction(async (transactionManager) => {
        const postRepository = transactionManager.getRepository(Post);
        const tagRepository = transactionManager.getRepository(Tag);

        post = await postRepository.findOne({
          relations: [
            'meta',
            'contentType',
            'author',
            'author.meta',
            'parent',
            'tags'
          ],
          where: {
            id: req.params.postId
          }
        });
        if (!post) throw new BadRequestError('invalid_post');
        if (post?.type === 'post_version')
          throw new BadRequestError('invalid_post_type');

        await createPostVersion(
          transactionManager.getRepository(Post),
          post,
          req?.data?.user
        );

        if (req.body.slug) {
          const newSlug = req.body.slug;

          const oldSlugPath = post?.slugPath;
          const newSlugPath = post.parent
            ? `${post?.parent?.slugPath}/${req.body.slug}`
            : req.body.slug;

          post.slug = newSlug;
          post.slugPath = newSlugPath;

          await transactionManager.query(
            getReplaceChildrenQuery(
              'post',
              'slugPath',
              oldSlugPath,
              newSlugPath
            )
          );
        }

        if (req.body.name) {
          post.name = req.body.name;
        }

        if (Array.isArray(req?.body?.tags)) {
          const tags = await tagRepository.find({
            where: {
              id: In(
                req?.body?.tags.map((tag) => tag?.id).filter((id) => !!id)
              )
            }
          });
          post.tags = tags;
        }

        post.updatedAt = new Date();
        await postRepository.save(post);
        return post;
      });
    } catch (err) {
      if (err?.code === '23505') {
        throw new BadRequestError('duplicate_slug');
      }
      logger.error({
        type: 'post',
        message: 'error saving post',
        data: err.toString()
      });
      throw err;
    }

    res.send(mapPost(post));
  })
);

app.get(
  '/posts/:postId',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const { versionId } = req?.query;
    const postRepository = getRepository(Post);
    const post = await postRepository.findOne({
      relations: ['meta', 'contentType', 'author', 'author.meta', 'tags'],
      where: {
        id: req.params.postId
      }
    });
    if (!post) throw new BadRequestError('invalid_post');
    if (versionId) {
      const postVersion = await postRepository.findOne({
        relations: ['meta', 'contentType', 'author', 'author.meta', 'tags'],
        where: {
          id: versionId,
          parentId: post?.id
        }
      });
      if (!postVersion) throw new BadRequestError('invalid_post_version');
      return res.send(
        mapPostWithMeta({
          ...postVersion,
          id: post?.id,
          slug: post?.slug,
          slugPath: post?.slugPath,
          versionId: postVersion?.id
        })
      );
    }
    return res.send(mapPostWithMeta(post));
  })
);

/**
 * Restore version
 */
app.get(
  '/posts/:postId/versions',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const { count } = req?.query;

    const postRepository = getRepository(Post);
    const qb = postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.contentType', 'contentType')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.tags', 'tags')
      .leftJoinAndSelect('author.meta', 'author.meta')
      .where('post.parentId = :parentId', { parentId: req.params.postId })
      .andWhere('post.type = :type', { type: 'post_version' });

    if (count) {
      const number = await qb.getCount();
      return res.send({
        count: number
      });
    }

    const posts = await qb.addOrderBy('post.createdAt', 'DESC').getMany();
    return res.send(posts.map((post) => mapPostWithMeta(post)));
  })
);

/**
 * Restore version
 */
app.post(
  '/posts/:postId/versions/:versionId',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const entityManager = getManager();
    let post;
    await entityManager.transaction(async (transactionManager) => {
      const postRepository = transactionManager.getRepository(Post);

      post = await postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.contentType', 'contentType')
        .leftJoinAndSelect('post.meta', 'meta')
        .leftJoinAndSelect('post.tags', 'tags')
        .where('post.id = :id', { id: req.params.postId })
        .getOne();

      if (!post) throw new BadRequestError('invalid_post');

      const postVersion = await postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.contentType', 'contentType')
        .leftJoinAndSelect('post.meta', 'meta')
        .leftJoinAndSelect('post.tags', 'tags')
        .where('post.id = :id', { id: req.params.versionId })
        .andWhere('post.parentId = :parentId', {
          parentId: req.params.postId
        })
        .andWhere('post.type = :type', { type: 'post_version' })
        .getOne();

      if (!postVersion) throw new BadRequestError('invalid_post_version');

      await createPostVersion(postRepository, post, req?.data?.user);

      await updateMeta(transactionManager, Post, post, postVersion?.meta);

      post.tags = postVersion.tags;
      post.content = postVersion.content;
      post.name = postVersion.name;

      await postRepository.save(post);
    });
    res.send(mapPostWithMeta(post));
  })
);

/**
 * Delete versions
 */
app.delete(
  '/posts/:postId/versions',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const ids: number[] = req?.body ?? [];
    if (!ids || ids?.length === 0) return res.send([]);

    const postRepository = getRepository(Post);
    const deleted = await postRepository.delete({
      id: In(ids),
      type: 'post_version'
    });

    return res.send(deleted);
  })
);

app.get(
  '/posts/preview/:postId',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const id = req?.params?.postId;
    const {versionId} = req?.query;
    const postRepository = getRepository(Post);
    const post = await postRepository.findOne({id});
    if (!post) throw new BadRequestError('invalid_post');

    const token = sign({
      postId: post.id,
      userId: req?.data?.user?.id,
    }, process.env.PREVIEW_TOKEN_EXPIRES || 1800);

    const data = await Hooks.applyFilters('posts/preview/data', {
      post,
      data: {
        baseUrl: process.env.PREVIEW_BASE_URL,
        token
      },
      src: `${process.env.PREVIEW_BASE_URL}/${post?.slugPath}?${queryString.stringify({versionId, token})}`
    });

    return res.send(data);
  })
)

app.get(
  '/content/*',
  asyncMiddleware(async (req, res) => {
    let allowUnpublished = req?.query?.allowUnpublished === 'true';
    let versionId = req?.query?.versionId;
    const token = req?.headers?.token;

    if (allowUnpublished) {
      if (!token) allowUnpublished = false;
      const decoded = verify(token as string);
      if (!decoded || !decoded?.userId || !decoded?.postId) {
        allowUnpublished = false;
        versionId = undefined;
      }
    }

    const slugPath = (req.params[0] as string).replace(/\/$/, '');

    const post = await retrievePostAndCompile({
      slugPath,
      versionId: versionId as string,
    }, {allowUnpublished, query: req.query});
    res.send(post);
  })
);

app.post(
  '/posts/compile',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const post = {
      ...(req.body || {}),
      meta: []
    };

    const flat = flatten(req?.body?.meta || {});

    Object.keys(flat).forEach((key) => {
      if (!flat[key]) return;

      post.meta.push({
        key,
        value: flat[key]
      });
    });

    post.meta = post.meta.filter((meta) => flat[meta.key]);
    const compiled = await compilePost(post, { allowUnpublished: true });
    res.send(compiled);
  })
);

export default app;
