import ContentType from '@server/models/content-type.model';
import { EntityManager, In } from 'typeorm';
import { IContentType } from '@shared/interfaces/model';
import logger from '@shared/features/logger';

export type IImportContentTypes = {
  entityManager: EntityManager;
  data: any[];
  user: any;
  options?: {
    force?: boolean;
  };
};

export const importContentTypes = async ({
  entityManager,
  data: list,
  user,
  options,
}: IImportContentTypes): Promise<IContentType[]> => {
  const saved = [];
  const contentTypes = await entityManager.find(ContentType, {
    where: {
      name: In(list?.map((contentType) => contentType?.name)),
    },
  });

  if (contentTypes?.length > 0) {
    logger.info('Importing content types.');
  }

  await Promise.all(
    list.map(async (item) => {
      const contentType = contentTypes.find((ct) => ct.name === item.name);
      if (contentType && !options?.force) {
        logger.info(`Skipping ${contentType?.name}, exists.`);
        return;
      }

      if (contentType) {
        contentType.author = user;
        contentType.fields = JSON.stringify(item.fields || []);
        const obj = await entityManager.save(ContentType, contentType);
        logger.info(`Updated content type ${contentType?.name}.`);
        saved.push(obj);
        return;
      }

      const obj = await entityManager.save(ContentType, {
        name: item.name,
        type: item.type,
        author: user,
        fields: JSON.stringify(item.fields || []),
      });
      logger.info(`Created new content type ${item?.name}.`);
      saved.push(obj);
    })
  );
  if (saved?.length > 0) {
    logger.info('Importing content types success.');
  }
  return saved;
};

export const exportContentTypes = async ({
  entityManager,
}: {
  entityManager: EntityManager;
}): Promise<IContentType> => {
  const contentTypeRepository = entityManager.getRepository(ContentType);
  const contentTypes = await contentTypeRepository.find();
  const mappedContentTypes = contentTypes.map((contentType) => {
    let fields = [];
    try {
      fields = JSON.parse(contentType.fields);
    } catch {
      //
    }
    return {
      name: contentType?.name,
      type: contentType?.type,
      fields,
    };
  });
  return mappedContentTypes as any;
};
