import Hooks from '@shared/features/hooks';
import { unflatten } from '@server/common/object';
import { parseInternalMetaContent } from '@server/common/post.parser';

export const getAssetsSrc = (npath: string) => {
  return `${
    process.env.BURDY_HOST?.length > 0 ? process.env.BURDY_HOST : ''
  }/api/uploads/${npath}`;
};

Hooks.addSyncFilter(
  'assets/public-mapping',
  (asset) => {
    const meta: any = {};
    (asset?.meta || []).forEach((m) => {
      meta[m.key] = m?.value;
    });
    return {
      name: asset.name,
      npath: asset.npath,
      height: meta?.height,
      width: meta?.width,
      alt: meta?.alt,
      copyright: meta?.copyright,
      meta,
      mimeType: asset.mimeType,
      tags: mapPublicTags(asset.tags),
      src: `${
        process.env.BURDY_HOST?.length > 0 ? process.env.BURDY_HOST : ''
      }/api/uploads/${asset.npath}`,
    };
  },
  { id: 'resolve', priority: 10 }
);

export const mapPublicAsset = (asset) => {
  if (!asset) return undefined;
  return Hooks.applySyncFilters('assets/public-mapping', asset);
};

export const mapAsset = (asset) => {
  if (!asset) return undefined;
  return {
    ...asset,
    author: mapUser(asset.author),
    tags: mapTags(asset.tags),
  };
};

export const mapPost = (post) => {
  if (!post) return undefined;
  return {
    ...post,
    author: mapUser(post.author),
    tags: mapTags(post.tags),
    contentType: mapContentType(post.contentType),
  };
};

export const mapPostContainer = (post) => {
  if (!post) return undefined;
  return {
    id: post.id,
    name: post.name,
    slug: post.slug,
    slugPath: post.slugPath,
    type: post.type,
    contentType: mapContentType(post.contentType),
    tags: mapTags(post.tags),
  };
};

export const mapPostWithMeta = (post) => {
  if (!post) return undefined;

  return {
    ...post,
    contentType: mapContentType(post.contentType),
    author: mapUser(post.author),
    meta: parseInternalMetaContent(post),
    tags: mapTags(post.tags),
  };
};

export const mapPublicPostWithMeta = (post) => {
  if (!post) return undefined;

  const meta = {};
  (post?.meta || []).forEach((m) => {
    meta[m.key] = m?.value;
  });

  return {
    id: post.id,
    type: post.type,
    name: post.name,
    slug: post.slug,
    slugPath: post.slugPath,
    publishedFrom: post.publishedFrom,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    contentType: mapContentType(post.contentType),
    author: mapPublicUser(post.author),
    meta: unflatten(meta || {}),
    tags: mapPublicTags(post.tags),
  };
};

export const mapContentType = (contentType) => {
  let fields;
  try {
    fields = JSON.parse(contentType?.fields);
  } catch (e) {
    return undefined;
  }

  return {
    ...contentType,
    author: mapUser(contentType?.author),
    fields,
  };
};

export const mapUser = (user) => {
  if (!user) return undefined;
  delete user.password;
  return user;
};

export const mapPublicUser = (user) => {
  if (!user) return undefined;
  return {
    firstName: user?.firstName,
    lastName: user?.lastName,
  };
};

export const mapTag = (tag) => {
  if (!tag) return undefined;
  return {
    ...tag,
    author: mapUser(tag.author),
  };
};

export const mapTags = (tags) => {
  if (!tags) return undefined;
  return tags.map(mapTag);
};

export const mapPublicTag = (tag) => {
  if (!tag) return undefined;
  return {
    name: tag.name,
    slug: tag.slug,
    slugPath: tag.slugPath,
    parent: tag.parent,
    id: tag.id,
    author: mapPublicUser(tag.author),
  };
};

export const mapPublicTags = (tags) => {
  if (!tags) return undefined;
  return tags.map(mapPublicTag);
};
