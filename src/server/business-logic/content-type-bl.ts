import ContentType from '@server/models/content-type.model';
import { EntityManager, In } from 'typeorm';
import { IContentType } from '@shared/interfaces/model';

export type IImportContentTypes = {
  entityManager: EntityManager;
  contentTypes: any[];
  user: any;
  options?: {
    force?: boolean;
  };
};

export const importContentTypes = async ({
  entityManager,
  contentTypes: list,
  user,
  options,
}: IImportContentTypes): Promise<IContentType[]> => {
  const saved = [];
  const contentTypes = await entityManager.find(ContentType, {
    where: {
      name: In(list?.map((contentType) => contentType?.name)),
    },
  });

  await Promise.all(
    list.map(async (item) => {
      const contentType = contentTypes.find((ct) => ct.name === item.name);
      if (contentType && options?.force) {
        contentType.author = user;
        contentType.fields = JSON.stringify(item.fields || []);
        const obj = await entityManager.save(ContentType, contentType);
        saved.push(obj);
      } else if (!contentType) {
        const obj = await entityManager.save(ContentType, {
          name: item.name,
          type: item.type,
          author: user,
          fields: JSON.stringify(item.fields || []),
        });
        saved.push(obj);
      }
    })
  );
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
