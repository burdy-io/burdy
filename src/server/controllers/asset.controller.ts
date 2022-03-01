import express from 'express';
import authMiddleware from '@server/middleware/auth.middleware';
import asyncMiddleware from '@server/middleware/async.middleware';
import async from 'async';
import {
  EntityManager,
  getConnection,
  getManager,
  getRepository,
  getTreeRepository,
  In,
} from 'typeorm';
import Asset from '@server/models/asset.model';
import path from 'path';
import BadRequestError from '@server/errors/bad-request-error';
import * as yup from 'yup';
import sizeOf from 'image-size';
import Tag from '@server/models/tag.model';
import FileDriver from '@server/drivers/file.driver';
import {
  getReplaceChildrenQuery,
  updateMeta,
} from '@server/common/orm-helpers';
import { mapAsset } from '@server/common/mappers';
import Hooks from '@shared/features/hooks';

const app = express();

const FOLDER_MIME_TYPE = 'application/vnd.burdy.folder';
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const generateUniqueName = async (
  manager: EntityManager,
  name: string,
  parent: number,
  counter = 1
) => {
  const ext = path.extname(name);
  const index = name.lastIndexOf(ext);

  let proposedName = name.substring(0, index);
  if (index > -1 && ext.length > 0) {
    proposedName = `${proposedName} (${counter})${ext}`;
  } else {
    proposedName = `${proposedName} (${counter})`;
  }

  const searchObj: any = {
    name: proposedName,
  };
  if (parent) {
    searchObj.parentId = parent;
  }
  const asset = await manager.findOne(Asset, searchObj);

  if (asset) {
    counter++;
    proposedName = await generateUniqueName(manager, name, parent, counter);
  }
  return proposedName;
};

const getParent = async (
  manager: EntityManager,
  components: string[],
  parent
) => {
  if (components.length > 0) {
    let newParent;
    const name = components.shift();
    const npath = parent ? `${parent.npath}/${name}` : name;
    try {
      newParent = await manager.findOne(Asset, {
        npath,
      });

      if (!newParent) {
        newParent = await manager.save(Asset, {
          parent,
          name,
          mimeType: FOLDER_MIME_TYPE,
          npath,
        });
      }
    } catch (err) {
      newParent = await manager.findOne(Asset, {
        npath,
      });
    }

    parent = await getParent(manager, components, newParent);
  }

  return parent;
};

app.get(
  '/assets',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const assetRepository = getRepository(Asset);
    const databaseType = getConnection().options.type;

    const { id, parentId, mimeType, search, npath } = req.query as any;

    const qb = assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.meta', 'meta')
      .leftJoinAndSelect('asset.tags', 'tags');

    if (id) {
      qb.andWhereInIds(id.split(','));
    }

    if (npath) {
      qb.andWhere('asset.npath IN (:...npath)', {
        npath: npath.split(',')
      });
    }

    qb.leftJoinAndSelect(
      (q) =>
        q
          .select([
            'npath',
            databaseType === 'postgres' ? '"parentId"' : 'parentId',
            databaseType === 'postgres' ? '"mimeType"' : 'mimeType',
          ])
          .from(Asset, 'thumbnail')
          .where('thumbnail.mimeType IN (:...mimeTypes)', {
            mimeTypes: IMAGE_MIME_TYPES,
          }),
      'thumbnail',
      databaseType === 'postgres'
        ? 'thumbnail."parentId" = asset.id'
        : 'thumbnail.parentId = asset.id'
    );

    qb.addSelect('thumbnail.npath', 'asset_thumbnail');

    if (search?.length > 0) {
      qb.andWhere('asset.mimeType != :mimeType', {
        mimeType: FOLDER_MIME_TYPE,
      }).andWhere('LOWER(asset.name) LIKE :search', {
        search: `%${search.toLowerCase()}%`,
      });
    }

    if (mimeType?.length > 0) {
      qb.andWhere('asset.mimeType IN (:...mimeTypes)', {
        mimeTypes: [...mimeType.split(','), FOLDER_MIME_TYPE],
      });
    }

    if (!(search?.length > 0) && !(id || npath)) {
      if (parentId) {
        qb.andWhere('asset.parentId = :parentId', { parentId });
      } else {
        qb.andWhere('asset.parentId IS NULL');
      }
    }

    const assets = await qb.orderBy('asset.name', 'DESC').getMany();
    return res.send(assets.map(mapAsset));
  })
);

app.get(
  '/assets/ancestors',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const assetTreeRepository = await getTreeRepository(Asset);
    let asset: Asset;
    let ancestorsTree: Asset;

    const { id } = req.query;

    if (id) {
      asset = await assetTreeRepository.findOne({
        relations: ['tags'],
        where: {
          id,
        },
      });
      if (!asset) throw new BadRequestError('invalid_asset');
      ancestorsTree = await assetTreeRepository.findAncestorsTree(asset);
    }

    res.send(Asset.getAncestorsList(ancestorsTree).reverse().map(mapAsset));
  })
);

app.get('/assets/single',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const assetRepository = getRepository(Asset);
    const { attachment, npath } = req.query;

    const asset = await assetRepository.findOne({
      relations: ['tags'],
      where: {
        npath
      },
    });
    if (!asset) throw new BadRequestError('invalid_asset');

    if (asset.mimeType === FOLDER_MIME_TYPE)
      throw new BadRequestError('invalid_asset');

    let content;
    if (asset.document) {
      content = await FileDriver.getInstance().read(asset.document);
    }

    res.set('Content-Type', asset.mimeType);
    res.set('Content-Length', `${asset.contentLength}`);
    if (IMAGE_MIME_TYPES.indexOf(asset.mimeType) === -1 || attachment) {
      res.attachment(asset.name);
    }
    res.send(content);
  })
);

app.get(
  '/assets/:id',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const assetRepository = getRepository(Asset);
    const { attachment } = req.query;

    const asset = await assetRepository.findOne({
      relations: ['tags'],
      where: {
        id: req.params.id,
      },
    });
    if (!asset) throw new BadRequestError('invalid_asset');

    if (asset.mimeType === FOLDER_MIME_TYPE)
      throw new BadRequestError('invalid_asset');

    let content;
    if (asset.document) {
      content = await FileDriver.getInstance().read(asset.document);
    }

    res.set('Content-Type', asset.mimeType);
    res.set('Content-Length', `${asset.contentLength}`);
    if (IMAGE_MIME_TYPES.indexOf(asset.mimeType) === -1 || attachment) {
      res.attachment(asset.name);
    }
    res.send(content);
  })
);

const getKeyName = (key: string = '') => {
  return key.split('/').pop();
};

// Create folder, assets
app.post(
  '/assets',
  authMiddleware(['assets_create']),
  FileDriver.getInstance().getUpload().single('file'),
  asyncMiddleware(async (req, res) => {
    const entityManager = getManager();
    const params = req.body;

    const { duplicateName } = params;

    try {
      let asset;

      await entityManager.transaction(async (tManager) => {
        let parent;
        if (params.parentId) {
          parent = await tManager.findOne(Asset, { id: params.parentId });
          if (!parent) throw new BadRequestError('invalid_parent');
        }

        const nameComponents = params.name
          .split('/')
          .filter((cmp) => cmp?.length > 0);
        let name = nameComponents.pop();
        if (nameComponents.length > 0) {
          parent = await getParent(entityManager, nameComponents, parent);
        }

        const searchObj: any = {
          name,
        };
        if (parent) {
          searchObj.parentId = parent.id;
        }

        asset = await tManager.findOne(Asset, searchObj);
        if (asset) {
          if (duplicateName) {
            name = await generateUniqueName(tManager, name, parent);
          } else {
            throw new BadRequestError('duplicate_name');
          }
        }

        const assetObj: any = {
          name,
          mimeType: params.mimeType,
          author: req?.data?.user,
        };

        if (parent) {
          assetObj.parent = parent;
          assetObj.npath = `${parent.npath}/${name}`;
        } else {
          assetObj.npath = name;
        }

        if (params?.mimeType !== FOLDER_MIME_TYPE) {
          if (!req.file) throw new BadRequestError('invalid_file');
          const stat = await FileDriver.getInstance().stat(
            req?.file?.filename || getKeyName(req?.file?.key)
          );
          if (!stat) throw new BadRequestError('invalid_file');

          if (IMAGE_MIME_TYPES.indexOf(params.mimeType) > -1) {
            const file = await FileDriver.getInstance().read(
              req?.file?.filename || getKeyName(req?.file?.key)
            );
            const dimensions = sizeOf(file);
            assetObj.meta = [
              {
                key: 'height',
                value: dimensions.height,
              },
              {
                key: 'width',
                value: dimensions.width,
              },
            ];
          }

          assetObj.provider = FileDriver.getInstance().getName();
          assetObj.contentLength = stat.contentLength;
          assetObj.document = req?.file?.filename || getKeyName(req?.file?.key);
        }

        asset = await tManager.save(Asset, assetObj);
      });
      return res.send(mapAsset(asset));
    } catch (err) {
      await FileDriver.getInstance().delete(
        req?.file?.filename || getKeyName(req?.file?.key)
      );
      throw err;
    }
  })
);

app.put(
  '/assets/:id/rename',
  authMiddleware(['assets_update']),
  asyncMiddleware(async (req, res) => {
    await req.validate(
      {
        name: yup.string().required(),
      },
      'body'
    );

    const entityManager = getManager();

    let updatedAsset;
    await entityManager.transaction(async (tManager) => {
      const asset = await entityManager.findOne(Asset, { id: req?.params?.id });
      if (!asset) throw new BadRequestError('invalid_asset');

      asset.name = req.body.name;
      const originalNPath = asset.npath;

      const components = asset.npath.split('/');
      components.pop();
      components.push(req.body.name);

      const npath = components.join('/');
      asset.npath = npath;

      await tManager.save(Asset, asset);
      const result = await tManager.query(
        getReplaceChildrenQuery(tManager.getRepository(Asset).metadata.tableName, 'npath', originalNPath, npath)
      );

      // if not at least one entry (the very object we're renaming) was updated, then the query or the data is wrong
      if (result[1] < 1) {
        // throw new Error('Something went wrong during rename.');
      }

      updatedAsset = await tManager.findOne(Asset, { id: req.params.id });
    });
    return res.send(mapAsset(updatedAsset));
  })
);

app.put(
  '/assets/:id',
  authMiddleware(['assets_update']),
  asyncMiddleware(async (req, res) => {
    await req.validate(
      {
        alt: yup.string().max(256),
        copyright: yup.string().max(256),
      },
      'body'
    );

    const entityManager = getManager();
    await entityManager.transaction(async (tManager) => {
      const asset = await entityManager.findOne(Asset, {
        relations: ['meta'],
        where: {
          id: req?.params?.id,
        },
      });
      if (!asset) throw new BadRequestError('invalid_asset');

      const meta = [];
      if (req?.body?.alt) {
        meta.push({
          key: 'alt',
          value: req?.body?.alt,
        });
      }
      if (req?.body?.copyright) {
        meta.push({
          key: 'copyright',
          value: req?.body?.copyright,
        });
      }

      await updateMeta(tManager, Asset, asset, meta, /^(alt|copyright)/);

      if (Array.isArray(req?.body?.tags)) {
        const tags = await tManager.getRepository(Tag).find({
          where: {
            id: In(req?.body?.tags.map((tag) => tag?.id).filter((id) => !!id)),
          },
        });
        asset.tags = tags;
      }

      await tManager.save(asset);
      return res.send(mapAsset(asset));
    });
  })
);

app.delete(
  '/assets',
  authMiddleware(['assets_delete']),
  asyncMiddleware(async (req, res) => {
    const ids = req?.body ?? [];
    if (!ids || ids?.length === 0) return res.send([]);
    const entityManager = getManager();
    const documents: string[] = [];
    const toDeleteAssets = [];

    await entityManager.transaction(async (tManager) => {
      const assetTreeRepository = tManager.getTreeRepository(Asset);
      const assets = await tManager.findByIds(Asset, ids);
      if (assets.length === 0) return [];

      await async.eachSeries(assets, async (asset, next) => {
        const children = await assetTreeRepository.findDescendants(asset);
        children.forEach((child) => {
          toDeleteAssets.push(child);
          if (child.document) {
            documents.push(child.document);
          }
        });
        next();
      });

      return tManager.delete(Asset, {
        id: In(toDeleteAssets.map((asset) => asset.id)),
      });
    });

    FileDriver.getInstance().delete(documents);

    return res.send(toDeleteAssets.map((asset) => asset.id));
  })
);

app.get(
  '/uploads/*',
  asyncMiddleware(async (req, res) => {
    const assetRepository = getRepository(Asset);

    const videoRange = req.headers.range;

    const asset = await assetRepository.findOne({ npath: req.params[0] });
    if (!asset) throw new BadRequestError('invalid_asset');
    if (asset.mimeType === FOLDER_MIME_TYPE)
      throw new BadRequestError('invalid_asset');
    await Hooks.doAction('public/getAsset', asset);

    if (videoRange) {
      const parts = videoRange.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : asset.contentLength - 1;
      const chunksize = end - start + 1;

      const file = FileDriver.getInstance().createReadStream(asset.document, {
        range: videoRange,
        start,
        end,
      });

      const head = {
        'Content-Range': `bytes ${start}-${end}/${asset.contentLength}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': asset.mimeType,
        'Cache-Control':
          process.env.ASSETS_CACHE_CONTROL?.length > 0
            ? process.env.ASSETS_CACHE_CONTROL
            : 'no-cache',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': asset.contentLength,
        'Content-Type': asset.mimeType,
        'Cache-Control':
          process.env.ASSETS_CACHE_CONTROL?.length > 0
            ? process.env.ASSETS_CACHE_CONTROL
            : 'no-cache',
      };
      res.writeHead(200, head);
      FileDriver.getInstance().createReadStream(asset.document).pipe(res);
    }
  })
);

export default app;
