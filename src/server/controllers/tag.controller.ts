import express from 'express';
import authMiddleware from '@server/middleware/auth.middleware';
import asyncMiddleware from '@server/middleware/async.middleware';
import { Brackets, getManager, getRepository, In } from 'typeorm';
import Tag from '@server/models/tag.model';
import * as yup from 'yup';
import { ITag } from '@shared/interfaces/model';
import BadRequestError from '@server/errors/bad-request-error';
import { getReplaceChildrenQuery } from '@server/common/orm-helpers';
import { mapTag } from '@server/common/mappers';

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
            getReplaceChildrenQuery(tagRepository.metadata.tableName, 'slugPath', oldSlugPath, newSlugPath)
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

export default app;
