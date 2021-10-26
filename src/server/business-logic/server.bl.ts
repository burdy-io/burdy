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
import { exportTags, importTags } from '@server/business-logic/tags.bl';

export const exportContent = async () => {
  await getManager().transaction(async (entityManager) => {
    await new Promise((resolve) =>
      rimraf(PathUtil.burdyRoot('export'), resolve)
    );

    const tags = await exportTags({ entityManager });
    const contentTypes = await exportContentTypes({ entityManager });
    const assets = await exportAssets({ entityManager });
    const posts = await exportPosts({ entityManager });

    await fse.writeFile(
      PathUtil.burdyRoot('export', 'content.json'),
      JSON.stringify({
        tags,
        assets,
        contentTypes,
        posts: posts.map(mapPost),
      })
    );
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
