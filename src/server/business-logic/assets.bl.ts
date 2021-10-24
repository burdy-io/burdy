import { EntityManager } from 'typeorm';
import { IAsset } from '@shared/interfaces/model';
import Asset from '@server/models/asset.model';
import BadRequestError from '@server/errors/bad-request-error';
import FileDriver from '@server/drivers/file.driver';
import fse from 'fs-extra';
import PathUtil from '@scripts/util/path.util';
import { v4 as uuidv4 } from 'uuid';
import async from 'async';
import { updateMeta } from '@server/common/orm-helpers';
import logger from '@shared/features/logger';

const FOLDER_MIME_TYPE = 'application/vnd.burdy.folder';

export const getParent = async (
  manager: EntityManager,
  components: string[],
  parent?: any
) => {
  if (components.length > 0) {
    let newParent;
    const name = components.shift();
    const npath = parent ? `${parent.npath}/${name}` : name;
    try {
      newParent = await manager.save(Asset, {
        parent,
        name,
        mimeType: FOLDER_MIME_TYPE,
        npath,
      });
    } catch (err) {
      newParent = await manager.findOne(Asset, {
        npath,
      });
    }

    parent = await getParent(manager, components, newParent);
  }

  return parent;
};

export type IImportAssets = {
  manager: EntityManager;
  asset: IAsset;
  user: any;
  options?: {
    force?: boolean;
  };
};

export const importAsset = async ({
  manager,
  asset,
  user,
  options,
}: IImportAssets): Promise<IAsset | undefined> => {
  let saved;
  let document;
  logger.info(`Importing asset: ${asset?.npath}, mimeType: ${asset.mimeType}.`);
  const writeFile = (asset: IAsset) => {
    return new Promise<string>((resolve, reject) => {
      const key = uuidv4();

      const documentComponents = asset.document
        .split('/')
        .filter((cmp) => cmp?.length > 0);
      const document = documentComponents.pop();
      const readStream = fse.createReadStream(
        PathUtil.burdyRoot('export', 'content', document)
      );
      logger.info(`Writing new file for ${asset.npath}, read document: ${document}.`);
      if (FileDriver.getInstance().getName() === 's3') {
        (FileDriver.getInstance() as any)
          .uploadReadableStream(key, readStream)
          .then(() => {
            logger.info(`Writing new file for ${asset.npath} successful, document: ${key}, provider s3.`);
            resolve(key);
          })
          .catch((err) => {
            logger.error(`Writing new file for ${asset.npath} failed, provider s3.`);
            logger.error(err);
            reject(err);
          });
      } else {
        const writeStream = FileDriver.getInstance().createWriteStream(key);
        writeStream.on('close', () => {
          logger.info(`Writing new file for ${asset.npath} successful, document: ${key}, provider fs.`);
          return resolve(key);
        });

        readStream
          .on('error', (err) => {
            logger.error(`Writing new file for ${asset.npath} failed, provider fs.`);
            logger.error(err);
            reject(err);
          })
          .pipe(writeStream);
      }
    });
  };

  try {
    const searchObj: any = {
      npath: asset.npath,
    };
    saved = await manager.findOne(Asset, searchObj);

    if (saved && !options?.force) {
      logger.info(`Skipping ${asset.npath}, exists.`);
      return;
    }

    if (saved?.mimeType === FOLDER_MIME_TYPE) {
      logger.info(`Skipping ${asset.npath}, folder exists.`);
      return;
    }

    if (saved) {
      logger.info(`Updating ${asset.npath}, existing.`);
      document = await writeFile(asset);
      const stat = await FileDriver.getInstance().stat(document);
      if (!stat) throw new BadRequestError('invalid_file');

      saved.provider = FileDriver.getInstance().getName();
      saved.author = user;
      saved.contentLength = stat.contentLength;
      saved.document = document;

      saved = await manager.save(Asset, saved);

      await updateMeta(manager, Asset, saved, asset.meta);
      logger.info(`Updating ${asset.npath}, successful.`);
      return saved;
    }

    let parent;
    const nameComponents = asset.npath
      .split('/')
      .filter((cmp) => cmp?.length > 0);
    const name = nameComponents.pop();
    if (nameComponents.length > 0) {
      parent = await getParent(manager, nameComponents);
    }

    const assetObj: any = {
      name,
      mimeType: asset.mimeType,
      author: user,
      meta: (asset.meta || []).map((item) => ({
        key: item.key,
        value: item.value,
      })),
    };

    if (parent) {
      assetObj.parent = parent;
      assetObj.npath = `${parent.npath}/${name}`;
    } else {
      assetObj.npath = name;
    }

    logger.info(`Creating ${asset.npath}, mimeType: ${asset.mimeType}.`);
    if (asset?.mimeType !== FOLDER_MIME_TYPE) {
      document = await writeFile(asset);
      const stat = await FileDriver.getInstance().stat(document);
      if (!stat) throw new BadRequestError('invalid_file');

      assetObj.provider = FileDriver.getInstance().getName();
      assetObj.contentLength = stat.contentLength;
      assetObj.document = document;
    }

    saved = await manager.save(Asset, assetObj);
    logger.info(`Creating ${asset.npath}, mimeType: ${asset.mimeType} successful.`);
    return saved;
  } catch (err) {
    logger.info(`Creating asset ${asset.npath}, mimeType: ${asset.mimeType} failed.`);
    logger.error(err);
    await FileDriver.getInstance().delete(document);
    throw err;
  }
};

export const importAssets = async ({
  entityManager,
  assets,
  user,
  options,
}: {
  entityManager: EntityManager;
  assets: IAsset[];
  user: any;
  options?: any;
}) => {
  const sorted = (assets || []).sort((a, b) => {
    if (a.npath < b.npath) {
      return -1;
    }
    if (a.npath > b.npath) {
      return 1;
    }
    return 0;
  });
  await async.eachLimit(sorted, 1, async (item, next) => {
    try {
      await importAsset({
        manager: entityManager,
        user,
        asset: item,
        options,
      });
      next();
    } catch (e) {
      next(e);
    }
  });
};

export const exportAssets = async ({ entityManager }): Promise<IAsset> => {
  const assetRepository = entityManager.getRepository(Asset);
  const assets = await assetRepository.find();

  await fse.ensureDir(PathUtil.burdyRoot('export', 'content'));
  const writeFile = (asset) => {
    return new Promise<void>((resolve, reject) => {
      const documentComponents = asset.document
        .split('/')
        .filter((cmp) => cmp?.length > 0);
      const document = documentComponents.pop();

      const file = fse.createWriteStream(
        PathUtil.burdyRoot('export', 'content', document)
      );
      file.on('close', () => {
        return resolve();
      });
      FileDriver.getInstance()
        .createReadStream(asset.document)
        .on('error', (err) => {
          console.log(err);
          reject(err);
        })
        .pipe(file);
    });
  };

  await async.eachLimit<any>(assets, 10, async (item, next) => {
    try {
      if (item?.document) {
        await writeFile(item);
      }
      next();
    } catch (e) {
      next(e);
    }
  });
  return assets;
};
