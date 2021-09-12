import {
  DeepPartial,
  EntityManager,
  EntityTarget,
  FindConditions,
  FindOneOptions, getConnection,
  getRepository,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { IOption, IPage } from '@shared/interfaces/model';
import deepmerge from 'deepmerge';
import _ from 'lodash';
import BadRequestError from '@server/errors/bad-request-error';

const paginate = async <T>(
  repository: Repository<T>,
  { perPage = 10, page = 1, query = {} }: IOption<T>
): Promise<IPage<T>> => {
  const [results, count] = await repository.findAndCount({
    skip: perPage * (page - 1),
    take: perPage,
    ...query,
  });

  return {
    results,
    paginate: {
      pageSize: perPage,
      current: page,
      total: count,
    },
  };
};

const createRelationsArray = (relations: string | any) => {
  if (typeof relations !== 'string') {
    return [];
  }

  return relations.split(',');
};

const queryRelationsArray = <T>(
  query: SelectQueryBuilder<T>,
  relations: string | any
) => {
  createRelationsArray(relations).forEach((expand) => {
    query.leftJoinAndSelect(`user.${expand}`, expand);
  });
};

interface IEnhancedRepository<T> extends Repository<T> {
  findOneOrCreate: (
    options: FindOneOptions<T>,
    create?: DeepPartial<T>
  ) => Promise<T>;
  attach: (id: number, relation: string, entityIds: number[]) => Promise<void>;
  detach: (id: number, relation: string, entityIds: number[]) => Promise<void>;
  sync: (id: number, relation: string, entityIds: number[]) => Promise<void>;
  existsGuard: (
    where: FindConditions<T> | FindConditions<T>[]
  ) => Promise<void>;
}

// eslint-disable-next-line max-len
const getEnhancedRepository = <T>(
  entityClass: EntityTarget<T>,
  entityManager?: EntityManager,
  connectionName?: string
) => {
  const repository = entityManager
    ? (entityManager.getRepository(entityClass) as IEnhancedRepository<T>)
    : (getRepository(entityClass, connectionName) as IEnhancedRepository<T>);

  repository.findOneOrCreate = async (options, create = {}) => {
    let model = await repository.findOne(options);

    if (!model) {
      if (typeof options.where === 'object') {
        create = deepmerge(options.where as object, create as object) as any;
      }

      model = await repository.create(create);
    }

    return model;
  };

  repository.detach = async (
    id: number,
    relation: string,
    entityIds: number[]
  ) => {
    await repository
      .createQueryBuilder()
      .relation(relation)
      .of(id)
      .remove(entityIds);
  };

  repository.attach = async (
    id: number,
    relation: string,
    entityIds: number[]
  ) => {
    await repository
      .createQueryBuilder()
      .relation(relation)
      .of(id)
      .add(entityIds);
  };

  repository.sync = async (
    id: number,
    relation: string,
    entityIds: number[]
  ) => {
    const existingRelations = await repository
      .createQueryBuilder()
      .select('id')
      .relation(relation)
      .of(id)
      .loadMany();
    const existingIds = existingRelations.map((r) => r.id);

    const toRemove = _.difference(existingIds, entityIds);
    const toAdd = _.difference(entityIds, existingIds);

    await repository
      .createQueryBuilder()
      .relation(relation)
      .of(id)
      .addAndRemove(toAdd, toRemove);
  };

  repository.existsGuard = async (where) => {
    const count = await repository.count({ where });
    const validationResult = Array.isArray(where)
      ? count === where.length
      : count === 1;

    if (!validationResult) {
      throw new BadRequestError('not_found');
    }
  };

  return repository;
};

const getReplaceChildrenQuery = (
  table: string,
  column: string,
  oldVal: string,
  newVal: string
) => {
  const databaseType = getConnection().options.type;

  if (databaseType === 'postgres') {
    return (
      `UPDATE "${table}" SET "${column}" = REPLACE("${column}", '${oldVal}', '${newVal}'), ` +
      `"updatedAt" = CURRENT_TIMESTAMP ` +
      `WHERE ("${column}" LIKE '${oldVal}' OR "${column}" LIKE '${oldVal}/%')`
    );
  }

  return (
    `UPDATE ${table} SET ${column} = REPLACE(${column}, '${oldVal}', '${newVal}'), ` +
    `updatedAt = CURRENT_TIMESTAMP ` +
    `WHERE (${column} LIKE '${oldVal}' OR ${column} LIKE '${oldVal}/%')`
  );
}


export {
  paginate,
  getEnhancedRepository,
  createRelationsArray,
  queryRelationsArray,
  getReplaceChildrenQuery,
};

export const updateMeta = async (
  entityManager: EntityManager,
  model: any,
  object: any,
  meta = [],
  pattern?: RegExp
) => {
  const newMetaObj = {};
  meta.forEach((m) => {
    newMetaObj[m.key] = m;
  });

  object.meta = object.meta.filter((m) => {
    return newMetaObj[m.key] || (pattern ? !m?.key?.match(pattern) : false);
  });

  meta.forEach((m) => {
    const entityMeta = object.meta.find((n) => n.key === m.key);
    if (entityMeta) {
      entityMeta.value = m.value;
    } else {
      object.meta.push({
        key: m.key,
        value: m.value,
      });
    }
  });

  await entityManager.save(model, object);
};
