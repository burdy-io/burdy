import { Brackets, getRepository, In } from 'typeorm';
import Post from '@server/models/post.model';
import Asset from '@server/models/asset.model';
import BadRequestError from '@server/errors/bad-request-error';
import { parseContent } from '@server/common/post.parser';
import { mapPublicAsset, mapPublicPostWithMeta } from '@server/common/mappers';
import _ from 'lodash';
import { IPost } from '@shared/interfaces/model';

const MAX_DEBT = process.env.POSTS_MAX_RELATIONS_DEBT || 3;

export interface ICompilePostOptions {
  debt?: number;
  allowNull?: boolean;
  allowUnpublished?: boolean;
}

export interface ICompilePostParams {
  id?: number | string;
  slugPath?: string;
}

export const publishedQuery = (qb: any, allowUnpublished?: boolean) => {
  if (!allowUnpublished) {
    qb.andWhere('post.publishedAt is NOT NULL');
    qb.andWhere(
      new Brackets((subQb) => {
        subQb
          .where('post.publishedFrom is NULL')
          .orWhere('post.publishedFrom <= CURRENT_TIMESTAMP');
      })
    );
    qb.andWhere(
      new Brackets((subQb) => {
        subQb
          .where('post.publishedUntil is NULL')
          .orWhere('post.publishedUntil >= CURRENT_TIMESTAMP');
      })
    );
  }
};

export const retrievePostAndCompile = async ({ id, slugPath }: ICompilePostParams, options?: ICompilePostOptions) => {
  const postRepository = getRepository(Post);
  const where: any = {};
  if (slugPath) {
    where.slugPath = slugPath;
  } else if (id) {
    where.id = id;
  }

  const qb = await postRepository.createQueryBuilder('post')
    .leftJoinAndSelect('post.meta', 'meta')
    .leftJoinAndSelect('post.author', 'author')
    .leftJoinAndSelect('post.tags', 'tags')

  if (slugPath) {
    qb.where('post.slugPath = :slugPath', {slugPath});
  } else if (id) {
    qb.where('post.id = :id', {id});
  }

  publishedQuery(qb, options?.allowUnpublished);

  const post = await qb.getOne();

  const getReturn = () => {
    if (options?.allowNull) return null;
    throw new BadRequestError('invalid_post');
  };
  if (!post) return getReturn();

  const compiledPost = await compilePost(post, options);
  return compiledPost;
};

export const compilePost = async (post: IPost, options?: ICompilePostOptions) => {
  const assetRepository = getRepository(Asset);

  const debt = options?.debt || 0;

  const {
    content,
    assets: assetsRefs,
    references
  } = parseContent(post);

  const mappedPost = mapPublicPostWithMeta(post);

  // Inject references
  const referencesIds = _.uniq(Object.values(references || {})).filter(id => !!id);
  if (referencesIds?.length > 0 && debt < MAX_DEBT) {
    // @ts-ignore
    const posts = await Promise.all(referencesIds.map((id: number) => {
      return retrievePostAndCompile({ id }, {
        ...(options || {}),
        allowNull: true,
        debt: debt + 1
      });
    }));
    const postsObj = {};
    posts.forEach((post: any) => {
      postsObj[post.id] = post;
    });

    Object.keys(references).forEach(key => {
      _.set(content, key, postsObj[references[key]]);
    });
  }
  // Inject assets
  const assetsIds = _.uniq(Object.values(assetsRefs || {})).filter(id => !!id);
  if (assetsIds?.length > 0) {
    const assets = await assetRepository.find({
      relations: ['meta', 'tags'],
      where: {
        id: In(assetsIds)
      }
    });
    const assetsObj = {};
    assets.forEach(asset => {
      assetsObj[asset.id] = mapPublicAsset(asset);
    });

    Object.keys(assetsRefs).forEach(key => {
      _.set(content, key, {
        ..._.get(content, key, {}),
        ...(assetsObj?.[assetsRefs?.[key]] || {})
      });
    });
  }

  return {
    ...mappedPost,
    meta: {
      ...mappedPost.meta,
      content
    }
  };
};