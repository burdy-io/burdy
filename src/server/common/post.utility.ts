import { Brackets, getRepository, In } from 'typeorm';
import Post from '@server/models/post.model';
import Asset from '@server/models/asset.model';
import BadRequestError from '@server/errors/bad-request-error';
import { parseContent } from '@server/common/post.parser';
import {
  mapPublicAsset,
  mapPublicPostWithMeta
} from '@server/common/mappers';
import _ from 'lodash';
import { IPost } from '@shared/interfaces/model';
import Hooks from '@shared/features/hooks';
import { Key, pathToRegexp } from 'path-to-regexp';
import deepcopy from 'deepcopy';

const MAX_RELATIONS_DEPTH = 3;

export interface ICompilePostOptions {
  depth?: number;
  relationsDepth?: number;
  nullable?: boolean;
  draft?: boolean;
  query?: any;
}

export interface ICompilePostParams {
  id?: number | string;
  slugPath?: string;
  query?: any;
  versionId?: number | string;
}

export const publishedQuery = (qb: any, draft?: boolean) => {
  if (!draft) {
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

export const retrievePostAndCompile = async ({ id, slugPath, versionId }: ICompilePostParams, options?: ICompilePostOptions) => {
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
    .leftJoinAndSelect('post.contentType', 'contentType')
    .leftJoinAndSelect('post.tags', 'tags')

  if (slugPath) {
    qb.where('post.slugPath = :slugPath', {slugPath});
  } else if (id) {
    qb.where('post.id = :id', {id});
  }

  publishedQuery(qb, options?.draft);

  let post = await qb.getOne();

  if (!(options?.depth > 0) && !options?.draft) {
    await Hooks.doAction('public/getPost', post);
  }

  if (versionId) {
    const postVersion = await postRepository.findOne({
      relations: ['meta', 'contentType', 'author', 'tags'],
      where: {
        id: versionId,
        parentId: post?.id
      }
    });
    if (!postVersion) throw new BadRequestError('invalid_post_version');
    post = postVersion;
  }

  const getReturn = () => {
    if (options?.nullable) return null;
    throw new BadRequestError('invalid_post');
  };
  if (!post) return getReturn();

  return post.type === 'hierarchical_post' ? compilePostContainer(post, options) : compilePost(post, options);
};

export const compilePostContainer = async (post: IPost, options?: ICompilePostOptions) => {
  const postRepository = getRepository(Post);
  const {draft} = options;
  const includeChildren = Boolean(options?.query?.includeChildren);

  if (!includeChildren) {
    return compilePost(post, options);
  }

  const page = options?.query?.page ?? 1;
  const perPage = options?.query?.perPage ?? 10;

  const childPostQuery = postRepository.createQueryBuilder('post')
    .leftJoinAndSelect('post.meta', 'meta')
    .leftJoinAndSelect('post.author', 'author')
    .leftJoinAndSelect('post.contentType', 'contentType')
    .leftJoinAndSelect('post.tags', 'tags');

  childPostQuery
    .where('post.type = :type', {type: 'post'})
    .andWhere('post.parentId = :parent', {parent: post.id});

  childPostQuery.skip(perPage * (page - 1));
  childPostQuery.take(perPage);

  publishedQuery(childPostQuery, draft);

  const childCountQuery = postRepository.createQueryBuilder('post');

  childCountQuery
    .where('post.type = :type', {type: 'post'})
    .andWhere('post.parentId = :parent', {parent: post.id});

  publishedQuery(childCountQuery, draft);

  const [childPosts, count] = await Promise.all([
    childPostQuery.getMany(),
    childCountQuery.getCount()
  ]);

  const [postContainer, ...posts] = await Promise.all([
    compilePost(post),
    ...childPosts.map(post => compilePost(post, options)),
  ]);

  return {
    ...postContainer,
    posts,
    paginate: {
      pageSize: perPage,
      current: page,
      total: count,
    },
  };
}

export const compilePost = async (post: IPost, options?: ICompilePostOptions) => {
  const assetRepository = getRepository(Asset);
  const relationsDepth = _.isNil(options?.relationsDepth) ? MAX_RELATIONS_DEPTH : options?.relationsDepth;
  const depth = options?.depth || 0;

  const {
    content,
    assets: assetsRefs,
    references
  } = parseContent(post);

  const mappedPost = mapPublicPostWithMeta(post);

  // Inject references
  const referencesIds = _.uniq(Object.values(references || {})).filter(slugPath => Boolean(slugPath));
  if (referencesIds?.length > 0 && depth < relationsDepth) {
    // @ts-ignore
    const posts = await Promise.all(referencesIds.map((slugPath: string) => {
      return retrievePostAndCompile({ slugPath }, {
        ...(options || {}),
        nullable: true,
        depth: depth + 1,
        relationsDepth
      });
    }));
    const postsObj = {};

    posts.filter(post => post).forEach((post: any) => {
      postsObj[post.slugPath] = post;
    });

    Object.keys(references).forEach(key => {
      if (postsObj[references[key]]) {
        _.set(content, key, postsObj[references[key]]);
      } else {
        _.unset(content, key);
      }
    });
  }
  // Inject assets
  const assetsNpaths = _.uniq(Object.values(assetsRefs || {})).filter(npath => !!npath);
  if (assetsNpaths?.length > 0) {
    const assets = await assetRepository.find({
      relations: ['meta', 'tags'],
      where: {
        npath: In(assetsNpaths)
      }
    });
    const assetsObj = {};
    assets.forEach(asset => {
      assetsObj[asset.npath] = mapPublicAsset(asset);
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

const escapeRegExp = (str: string) => {
  return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
};

export const buildPath = (path: string, rules: {source: string; rewrite: string;}[]): string | undefined => {
  let resultArray: RegExpExecArray | null;
  let keys: Key[] = [];
  rules = deepcopy(rules);

  const rule = rules.find((rule) => {
    keys = [];
    const regexp = pathToRegexp(rule.source, keys);
    resultArray = regexp.exec(path);
    return !!resultArray;
  });

  if (!rule) {
    return undefined;
  }

  const params: Record<Key['name'], string | undefined> = {};

  keys.forEach((key, index) => {
    params[key.name] = resultArray?.[index + 1];
  });

  const rewrite = (string: string, params: Record<Key['name'], string | undefined> = {}) => {
    let tmpString = string;
    Object.keys(params).forEach((key) => {
      tmpString = tmpString.replace(new RegExp(escapeRegExp(`{${key}}`), 'g'), params[key] || '');
    });
    return tmpString;
  };

  return rewrite(rule.rewrite as string, params)
};