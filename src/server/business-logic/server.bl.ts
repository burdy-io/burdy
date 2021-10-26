import { getManager } from 'typeorm';
import { isTrue } from '@admin/helpers/utility';
import fse from 'fs-extra';
import PathUtil from '@scripts/util/path.util';
import {
  exportContentTypes,
  importContentTypes,
} from '@server/business-logic/content-type-bl';
import { exportAssets, importAssets } from '@server/business-logic/assets.bl';
import { exportPosts, importPosts } from '@server/business-logic/post.bl';
import { IUser } from '@shared/interfaces/model';
import logger from '@shared/features/logger';
import rimraf from 'rimraf';
import { mapPost } from '@server/common/mappers';
import ConsoleOutput from '@scripts/util/console-output.util';
import archiver from 'archiver';
import { exportTags, importTags } from '@server/business-logic/tags.bl';
import async from 'async';
import unzipper from 'unzipper';
import path from 'path';
import DeferPromise from 'defer-promise';

interface IExportContentParams {
  output?: string;
  force?: boolean;
}

export const exportContent = async ({
  output,
  force = false,
}: IExportContentParams = {}) => {
  await getManager().transaction(async (entityManager) => {
    await (async () => {
      if (!output) return;

      if (!output.endsWith('.zip')) {
        ConsoleOutput.info(
          'File not ending with .zip, appending extension to name.'
        );
        output = `${output}.zip`;
      }

      const fileExists = await fse.pathExists(output);

      if (fileExists && !force) {
        ConsoleOutput.error(`File ${output} already exists. Skipping...`);
        return;
      }

      if (fileExists && force) {
        ConsoleOutput.info('Force flag provided, deleting previous entry.');
        await new Promise((resolve) => rimraf(output, resolve));
      }
    })();

    await new Promise((resolve) =>
      rimraf(PathUtil.burdyRoot('export'), resolve)
    );
    await fse.ensureDir(PathUtil.burdyRoot('export'));

    const tags = await exportTags({ entityManager });
    const contentTypes = await exportContentTypes({ entityManager });
    const assets = await exportAssets({ entityManager });
    const posts = await exportPosts({ entityManager });

    await Promise.all([
      fse.writeJson(PathUtil.burdyRoot('export', 'tags.json'), tags),
      fse.writeJson(
        PathUtil.burdyRoot('export', 'contentTypes.json'),
        contentTypes
      ),
      fse.writeJson(PathUtil.burdyRoot('export', 'assets.json'), assets),
      fse.writeJson(
        PathUtil.burdyRoot('export', 'posts.json'),
        posts.map(mapPost)
      ),
    ]);

    if (output) {
      const deferred = DeferPromise<void>();
      const outputStream = fse.createWriteStream(PathUtil.processRoot(output));

      const zipArchive = archiver('zip');
      await zipArchive.directory(PathUtil.burdyRoot('export'), false);
      zipArchive.pipe(outputStream);

      outputStream.on('close', () => {
        ConsoleOutput.info(
          `${zipArchive.pointer()} total bytes written to zip file.`
        );
        deferred.resolve();
      });

      outputStream.on('error', (e) => {
        console.log(e);
        deferred.reject(e);
      });

      await zipArchive.finalize();

      await deferred.promise;
    }

    ConsoleOutput.info('Export finished.');
  });
};

export const importContent = async ({
  user,
  options,
  file,
}: {
  user?: IUser;
  file?: string;
  options?: {
    force?: string | boolean;
  };
}) => {
  await getManager().transaction(async (entityManager) => {
    const force = isTrue(options?.force);
    logger.info('Starting import');
    const entry = PathUtil.burdyRoot('export');

    await (async () => {
      if (!file) return;
      const fileInput = PathUtil.processRoot(file);
      const zipExists = await fse.pathExists(fileInput);

      if (!zipExists) {
        ConsoleOutput.info('Zip not found. Skipping archive deflation...');
        return;
      }

      await new Promise((resolve) => rimraf(entry, resolve));

      ConsoleOutput.info(`Exporting ${file}...`);

      await fse
        .createReadStream(fileInput)
        .pipe(unzipper.Extract({ path: entry }))
        .promise();
    })();

    const [tags, assets, contentTypes, posts] = await async.map(
      ['tags.json', 'assets.json', 'contentTypes.json', 'posts.json'],
      async (file, next) => {
        try {
          const result = await fse.readJson(path.join(entry, file));
          next(null, result);
        } catch (e) {
          next(null, []);
        }
      }
    );

    await importTags({
      entityManager,
      tags,
      user,
    });

    await importContentTypes({
      entityManager,
      contentTypes,
      user,
      options: {
        force,
      },
    });

    await importAssets({
      entityManager,
      assets,
      user,
      options: {
        force,
      },
    });

    await importPosts({
      entityManager,
      posts,
      user,
      options: {
        force,
      },
    });

    logger.info('Import finished.');

    ConsoleOutput.info('Import finished.');
  });
};
