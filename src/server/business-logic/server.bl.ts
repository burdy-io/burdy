import { getManager } from 'typeorm';
import { isTrue } from '@admin/helpers/utility';
import fse from 'fs-extra';
import PathUtil from '@scripts/util/path.util';
import InternalServerError from '@server/errors/internal-server-error';
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
import ConsoleOutput from "@scripts/util/console-output.util";
import archiver from 'archiver'
import DeferPromise from 'defer-promise';
import { exportTags, importTags } from '@server/business-logic/tags.bl';

interface IExportContentParams {
  output: string;
  force: boolean;
}

export const exportContent = async ({output, force}: IExportContentParams) => {
  await getManager().transaction(async (entityManager) => {
    if (!output.endsWith('.zip')) {
      ConsoleOutput.info('File not ending with .zip, appending extension to name.');
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

    const tags = await exportTags({ entityManager });
    const contentTypes = await exportContentTypes({ entityManager });
    const assets = await exportAssets({ entityManager });
    const posts = await exportPosts({ entityManager });

    await new Promise(resolve => rimraf(PathUtil.burdyRoot('export'), resolve));
    await fse.ensureDir(PathUtil.burdyRoot('export'));

    await Promise.all([
      fse.writeFile(PathUtil.burdyRoot('export', 'tags.json'), JSON.stringify(tags)),
      fse.writeFile(PathUtil.burdyRoot('export', 'contentTypes.json'), JSON.stringify(contentTypes)),
      fse.writeFile(PathUtil.burdyRoot('export', 'assets.json'), JSON.stringify(assets)),
      fse.writeFile(PathUtil.burdyRoot('export', 'posts.json'), JSON.stringify(posts.map(mapPost)))
    ]);

    const deferred = DeferPromise<void>();
    const outputStream = fse.createWriteStream(PathUtil.processRoot(output));

    const zipArchive = archiver('zip');
    await zipArchive.directory(PathUtil.burdyRoot('export'), false);
    zipArchive.pipe(outputStream);

    outputStream.on('close', () => {
      ConsoleOutput.info(`${zipArchive.pointer()} total bytes`);
      deferred.resolve();
    });

    outputStream.on('error', (e) => {
      console.log(e);
      deferred.reject(e);
    })

    await zipArchive.finalize();

    await deferred.promise;
  });
};

export const importContent = async ({
  user,
  options,
}: {
  user?: IUser;
  options?: {
    force?: string;
  };
}) => {
  await getManager().transaction(async (entityManager) => {
    let content: any = {};
    const force = isTrue(options?.force);
    logger.info('Starting import');
    try {
      const file = await fse.readFile(
        PathUtil.burdyRoot('export', 'content.json'),
        'utf8'
      );
      content = JSON.parse(file);
    } catch (err) {
      logger.error('error loading file');
      throw new InternalServerError('import_failed');
    }

    const tags = content?.tags || [];
    const assets = content?.assets || [];
    const contentTypes = content?.contentTypes || [];
    const posts = content?.posts || [];

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
  });
};
