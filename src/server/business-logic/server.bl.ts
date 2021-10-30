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
  include?: string[];
}

const handlers = [
  {
    type: 'tags',
    exportBinding: exportTags,
    importBinding: importTags,
    filename: 'tags.json',
  },
  {
    type: 'contentTypes',
    exportBinding: exportContentTypes,
    importBinding: importContentTypes,
    filename: 'contentTypes.json',
  },
  {
    type: 'assets',
    exportBinding: exportAssets,
    importBinding: importAssets,
    filename: 'assets.json',
  },
  {
    type: 'posts',
    exportBinding: exportPosts,
    importBinding: importPosts,
    filename: 'posts.json',
  },
];

export const exportContent = async ({
  output,
  force = false,
  include,
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

    const exporters = !include
      ? handlers
      : handlers.filter(({ type }) => include.includes(type));

    let exports = await async.map(exporters, async (exporter, next) => {
      try {
        const { exportBinding, filename } = exporter;

        const result = await exportBinding({ entityManager });
        next(null, { result, filename });
      } catch (e) {
        logger.error(`Failed to export ${exporter.type}. Skipping...`);
        next(null, null);
      }
    });

    exports = exports.map((i) => i);

    await Promise.all(
      exports.map(({ result, filename }) => {
        return fse.writeJson(PathUtil.burdyRoot('export', filename), result);
      })
    );

    if (output) {
      const deferred = DeferPromise<void>();
      const outputStream = fse.createWriteStream(output);

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
  include,
}: {
  user?: IUser;
  file?: string;
  options?: {
    force?: string | boolean;
  };
  include?: string[];
}) => {
  await getManager().transaction(async (entityManager) => {
    const force = isTrue(options?.force);
    logger.info('Starting import');
    const entry = PathUtil.burdyRoot('export');

    await (async () => {
      if (!file) return;
      const fileInput = file;
      const zipExists = await fse.pathExists(file);

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

    const importers = !include
      ? handlers
      : handlers.filter(({ type }) => include.includes(type));

    let imports = await async.map(importers, async (handler, next) => {
      try {
        const { filename, importBinding } = handler;
        const result = await fse.readJson(path.join(entry, filename));
        next(null, { result, importBinding });
      } catch (e) {
        next(null, null);
      }
    });

    imports = imports.filter((i) => i);

    await async.each(imports, async (importData, next) => {
      try {
        const { result, importBinding } = importData as any;
        await importBinding({
          entityManager,
          user,
          data: result,
          options: { force },
        });
        next();
      } catch (e) {
        next(e);
      }
    });

    logger.info('Import finished.');

    ConsoleOutput.info('Import finished.');
  });
};
