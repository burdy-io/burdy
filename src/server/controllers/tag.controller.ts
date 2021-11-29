import express from 'express';
import authMiddleware from '@server/middleware/auth.middleware';
import asyncMiddleware from '@server/middleware/async.middleware';
import { Brackets, getManager, getRepository, In } from 'typeorm';
import Tag from '@server/models/tag.model';
import * as yup from 'yup';
import { ITag } from '@shared/interfaces/model';
import BadRequestError from '@server/errors/bad-request-error';
import { getEnhancedRepository, getReplaceChildrenQuery } from '@server/common/orm-helpers';
import { mapPublicTag, mapTag } from '@server/common/mappers';
import contentMiddleware from '@server/middleware/content.middleware';
import { isTrue } from '@admin/helpers/utility';

const app = express();

app.get(
  '/tags',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const search = req?.query?.search;
    const tagRepository = getRepository(Tag);

    const tagsQb = tagRepository
      .createQueryBuilder('tag')
      .leftJoinAndSelect('tag.meta', 'meta')
      .leftJoinAndSelect('tag.author', 'author')
      .leftJoinAndSelect('author.meta', 'author.meta');

    if (search?.length > 0) {
      const searchWhere = new Brackets((qb) => {
        qb.where('LOWER(tag.name) LIKE :search', {
          search: `%${(search as string).toLowerCase()}%`,
        }).orWhere('LOWER(tag.slug) LIKE :search', {
          search: `%${(search as string).toLowerCase()}%`,
        });
      });

      tagsQb.where(searchWhere);
    }

    tagsQb.orderBy('tag.name', 'DESC');
    const tags = await tagsQb.getMany();
    res.send(tags.map(mapTag));
  })
);

app.post(
  '/tags',
  authMiddleware(['tags_create']),
  asyncMiddleware(async (req, res) => {
    await req.validate(
      {
        name: yup.string().max(256).required(),
        slug: yup.string().max(256).required(),
      },
      'body'
    );

    const entityManager = getManager();
    const params = req.body;

    let tag: ITag;

    try {
      await entityManager.transaction(async (transactionManager) => {
        let parent;
        if (params.parentId) {
          parent = await transactionManager.findOne(Tag, {
            id: params.parentId,
          });
          if (!parent) throw new BadRequestError('invalid_parent');
        }

        const tagObj: any = {
          name: params.name,
          slug: params.slug,
          author: req?.data?.user,
        };

        if (parent) {
          tagObj.parent = parent;
          tagObj.slugPath = `${parent.slugPath}/${params.slug}`;
        } else {
          tagObj.slugPath = params.slug;
        }

        tag = await transactionManager.save(Tag, tagObj);
      });
    } catch (err) {
      if (err?.code === '23505') {
        throw new BadRequestError('duplicate_slug');
      }
      throw err;
    }
    return res.send(mapTag(tag));
  })
);

app.delete(
  '/tags',
  authMiddleware(['tags_delete']),
  asyncMiddleware(async (req, res) => {
    const ids: number[] = req?.body ?? [];
    if (!ids || ids?.length === 0) return res.send([]);

    const tagRepository = getRepository(Tag);
    const deleted = await tagRepository.delete({
      id: In(ids),
    });

    return res.send(deleted);
  })
);

app.put(
  '/tags/:tagId',
  authMiddleware(['tags_update']),
  asyncMiddleware(async (req, res) => {
    const entityManager = getManager();

    let tag: ITag;

    try {
      await entityManager.transaction(async (transactionManager) => {
        const tagRepository = transactionManager.getRepository(Tag);

        tag = await tagRepository.findOne({
          relations: ['meta', 'parent', 'author', 'author.meta'],
          where: {
            id: req.params.tagId,
          },
        });
        if (!tag) throw new BadRequestError('invalid_tag');

        if (req.body.slug) {
          const newSlug = req.body.slug;

          const oldSlugPath = tag?.slugPath;
          const newSlugPath = tag?.parent
            ? `${tag?.parent?.slugPath}/${req.body.slug}`
            : req.body.slug;

          tag.slug = newSlug;
          tag.slugPath = newSlugPath;

          await transactionManager.query(
            getReplaceChildrenQuery('tag', 'slugPath', oldSlugPath, newSlugPath)
          );
        }

        if (req.body.name) {
          tag.name = req.body.name;
        }
        tag.updatedAt = new Date();
        await tagRepository.save(tag);
      });
    } catch (err) {
      if (err?.code === '23505') {
        throw new BadRequestError('duplicate_slug');
      }
      throw err;
    }

    res.send(mapTag(tag));
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
