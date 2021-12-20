import express from 'express';
import contentMiddleware from '@server/middleware/content.middleware';
import asyncMiddleware from '@server/middleware/async.middleware';
import { getEnhancedRepository } from '@server/common/orm-helpers';
import Post from '@server/models/post.model';
import { isTrue } from '@admin/helpers/utility';
import { Brackets } from 'typeorm';
import { compilePost, publishedQuery } from '@server/common/post.utility';
import { mapPublicPostWithMeta, mapPublicTag } from '@server/common/mappers';
import Tag from '@server/models/tag.model';

const app = express();

app.get(
  '/search/posts',
  contentMiddleware({ alwaysAuthorize: true }),
  asyncMiddleware(async (req, res) => {
    const postRepository = getEnhancedRepository(Post);
    const qb = postRepository.createQueryBuilder('post');

    const contentTypeName = req?.query?.contentTypeName as string;
    const type = req?.query?.type as string;
    const search = req?.query?.search as string;
    const parent = req?.query?.parent as string;
    const onlyOrphans = req?.query?.onlyOrphans as string;
    const slugPath = req?.query?.slugPath as string;
    const tags = req?.query?.tags as string;
    const compile = req?.query?.compile as string;

    let relationsDepth;
    if (req?.query?.relationsDepth && !Number.isNaN(Number(req?.query?.relationsDepth))) {
      relationsDepth = Number(req?.query?.relationsDepth);
    }

    let limit = 100;
    if (req?.query?.limit && !Number.isNaN(Number(req?.query?.limit))) {
      limit = Number(req?.query?.limit);
    }
    let page = 1;
    if (req?.query?.page && !Number.isNaN(Number(req?.query?.page))) {
      page = Number(req?.query?.page);
    }
    const orderBy = req?.query?.orderBy as string;
    const order = req?.query?.order as string;

    const expand = ((req?.query?.expand as string) || '').split(',');

    if (contentTypeName || expand.find((val) => val === 'contentType')) {
      qb.leftJoinAndSelect('post.contentType', 'contentType');
    }

    if (isTrue(compile) || expand.find((val) => val === 'meta')) {
      qb.leftJoinAndSelect('post.meta', 'meta');
    }

    if (expand.find((val) => val === 'author')) {
      qb.leftJoinAndSelect('post.author', 'author');
    }

    if (tags || expand.find((val) => val === 'tags')) {
      qb.leftJoinAndSelect('post.tags', 'tags');
    }

    if (parent || expand.find((val) => val === 'parent')) {
      qb.leftJoinAndSelect('post.parent', 'parent');
    }

    qb.where('post.type IN (:...types)', {
      types: type ? type.split(',') : ['hierarchical_post', 'post', 'page'],
    });

    if (slugPath) {
      qb.andWhere('post.slugPath IN (:...slugPaths)', {
        slugPaths: (slugPath as string).split(','),
      });
    }

    if (contentTypeName) {
      qb.andWhere('contentType.name IN (:...contentTypeNames)', {
        contentTypeNames: contentTypeName.split(','),
      });
    }

    if (tags) {
      qb.andWhere('tags.slugPath IN (:...tagsSlugPaths)', {
        tagsSlugPaths: tags.split(','),
      });
    }

    if (isTrue(onlyOrphans)) {
      if (parent) {
        qb.andWhere('parent.slugPath = :parentSlugPath', {
          parentSlugPath: parent,
        });
      } else {
        qb.andWhere('post.parentId IS NULL');
      }
    } else if (parent) {
      qb.andWhere('post.slugPath LIKE :parentSlugPath', {
        parentSlugPath: `${(parent as string).toLowerCase()}/%`,
      });
    }

    if (search?.length > 0) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('LOWER(post.name) LIKE :search', {
              search: `%${(search as string).toLowerCase()}%`,
            })
            .orWhere('LOWER(post.slugPath) LIKE :search', {
              search: `%${(search as string).toLowerCase()}%`,
            });
        })
      );
    }

    const draft = isTrue(req?.query?.draft as string);
    if (!draft) {
      publishedQuery(qb);
    }

    const getMany = () => {
      qb.take(limit).skip((page - 1) * limit);
      return qb.getMany();
    };

    qb.addOrderBy(
      orderBy || 'post.slugPath',
      order === 'DESC' ? 'DESC' : 'ASC'
    );
    const [count, results] = await Promise.all([qb.getCount(), getMany()]);

    let posts;
    if (isTrue(compile)) {
      posts = await Promise.all((results || []).map(post => compilePost(post, {
        draft,
        relationsDepth: relationsDepth || 1
      })))
    } else {
      posts = (results || []).map((post) => mapPublicPostWithMeta(post))
    }

    res.send({
      count,
      results: posts,
      page,
      limit,
    });
  })
);

app.get(
  '/search/tags',
  contentMiddleware({ alwaysAuthorize: true }),
  asyncMiddleware(async (req, res) => {
    const tagRepository = getEnhancedRepository(Tag);
    const qb = tagRepository.createQueryBuilder('tag');

    const search = req?.query?.search as string;
    const parent = req?.query?.parent as string;
    const onlyOrphans = req?.query?.onlyOrphans as string;
    const slugPath = req?.query?.slugPath as string;

    let limit = 100;
    if (req?.query?.limit && !Number.isNaN(Number(req?.query?.limit))) {
      limit = Number(req?.query?.limit);
    }
    let page = 1;
    if (req?.query?.page && !Number.isNaN(Number(req?.query?.page))) {
      page = Number(req?.query?.page);
    }
    const orderBy = req?.query?.orderBy as string;
    const order = req?.query?.order as string;

    const expand = ((req?.query?.expand as string) || '').split(',');

    if (parent || expand.find((val) => val === 'parent')) {
      qb.leftJoinAndSelect('tag.parent', 'parent');
    }

    if (slugPath) {
      qb.andWhere('tag.slugPath IN (:...slugPaths)', {
        slugPaths: (slugPath as string).split(','),
      });
    }

    if (isTrue(onlyOrphans)) {
      if (parent) {
        qb.andWhere('parent.slugPath = :parentSlugPath', {
          parentSlugPath: parent,
        });
      } else {
        qb.andWhere('tag.parentId IS NULL');
      }
    } else if (parent) {
      qb.andWhere('tag.slugPath LIKE :parentSlugPath', {
        parentSlugPath: `${(parent as string).toLowerCase()}/%`,
      });
    }

    if (search?.length > 0) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('LOWER(tag.name) LIKE :search', {
              search: `%${(search as string).toLowerCase()}%`,
            })
            .orWhere('LOWER(tag.slugPath) LIKE :search', {
              search: `%${(search as string).toLowerCase()}%`,
            });
        })
      );
    }

    const getMany = () => {
      qb.take(limit).skip((page - 1) * limit);
      return qb.getMany();
    }

    qb.addOrderBy(orderBy || 'tag.slugPath', order === 'DESC' ? 'DESC' : 'ASC');
    const [count, results] = await Promise.all([
      qb.getCount(),
      getMany()
    ]);
    res.send({
      count,
      results: (results || []).map((tag) => mapPublicTag(tag)),
      page,
      limit
    });
  })
);

export default app;