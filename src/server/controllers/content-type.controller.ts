import express from 'express';
import authMiddleware from '@server/middleware/auth.middleware';
import asyncMiddleware from '@server/middleware/async.middleware';
import { getManager, getRepository, In } from 'typeorm';
import * as yup from 'yup';
import ContentType from '@server/models/content-type.model';
import BadRequestError from '@server/errors/bad-request-error';
import InternalServerError from '@server/errors/internal-server-error';
import Post from '@server/models/post.model';
import Hooks from '@shared/features/hooks';
import { mapContentType } from '@server/common/mappers';
import { isEmptyString } from '@admin/helpers/utility';
import { importContentTypes } from '@server/business-logic/content-type-bl';

const app = express();

app.get(
  '/content-types',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const contentTypeRepository = getRepository(ContentType);
    const id = req?.query?.id;
    const name = req?.query?.name;
    const search = req?.query?.search;
    const type = req?.query?.type;

    const qb = contentTypeRepository
      .createQueryBuilder('contentType')
      .leftJoinAndSelect('contentType.author', 'author')
      .leftJoinAndSelect('author.meta', 'author.meta');

    if (id) {
      qb.andWhereInIds((id as string).split(','));
    }

    if (name) {
      qb.andWhere('contentType.name IN (:...names)', {
        names: (name as string).split(',')
      });
    }

    if (search?.length > 0) {
      qb.andWhere('LOWER(contentType.name) LIKE :search', {
        search: `%${(search as string).toLowerCase()}%`,
      });
    }

    if (type) {
      qb.andWhere('contentType.type IN (:...types)', {
        types: (type as string).split(','),
      });
    }

    const contentTypes = await qb
      .addOrderBy('contentType.updatedAt', 'DESC')
      .getMany();

    res.send(contentTypes.map(mapContentType));
  })
);

app.post(
  '/content-types',
  authMiddleware(['content_types_create']),
  asyncMiddleware(async (req, res) => {
    await req.validate(
      {
        name: yup.string().max(256).required(),
        type: yup.string().max(256).required(),
      },
      'body'
    );

    const contentTypeRepository = getRepository(ContentType);
    try {
      const contentType = await contentTypeRepository.save({
        name: req.body.name,
        type: req.body.type,
        author: req?.data?.user,
        fields: JSON.stringify(req.body.fields ?? []),
      });
      res.send(mapContentType(contentType));
    } catch (err) {
      if (err?.code === '23505') {
        throw new BadRequestError('duplicate_name');
      }
      throw new InternalServerError('unknown_error');
    }
  })
);

app.delete(
  '/content-types',
  authMiddleware(['content_types_delete']),
  asyncMiddleware(async (req, res) => {
    const ids: number[] = req?.body ?? [];
    if (!ids || ids?.length === 0) return res.send([]);

    const force = req.query?.force === 'true';

    const postRepository = getRepository(Post);

    const postCount = await postRepository.count({
      contentTypeId: In(ids),
    });

    if (postCount > 0 && !force) throw new BadRequestError('posts_exist');

    const contentTypeRepository = getRepository(ContentType);
    const deleted = await contentTypeRepository.delete({
      id: In(ids),
    });

    return res.send(deleted);
  })
);

app.put(
  '/content-types/:contentTypeId',
  authMiddleware(['content_types_update']),
  asyncMiddleware(async (req, res) => {
    await req.validate(
      {
        name: yup.string().max(256).required(),
      },
      'body'
    );

    const contentTypeRepository = getRepository(ContentType);

    const contentType = await contentTypeRepository.findOne({
      relations: ['author', 'author.meta'],
      where: {
        id: req.params.contentTypeId,
      },
    });
    if (!contentType) throw new BadRequestError('invalid_content_type');

    if (req.body.name) {
      contentType.name = req.body.name;
    }

    if (req.body.fields) {
      contentType.fields = JSON.stringify(req.body.fields);
    }

    await contentTypeRepository.save(contentType);
    res.send(mapContentType(contentType));
  })
);

app.post(
  '/content-types/import',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const data = req?.body?.data || [];
    const force = req?.body?.force;

    const filtered = data.filter((contentType) => {
      return (
        !isEmptyString(contentType.name) && !isEmptyString(contentType.type)
      );
    });

    const entityManager = getManager();
    let response = [];
    await entityManager.transaction(async (transactionManager) => {
      response = await importContentTypes({
        entityManager: transactionManager,
        data: filtered,
        user: req?.data?.user,
        options: {
          force,
        },
      });
    });

    res.send(response);
  })
);

app.get(
  '/content-types/export',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const ids = ((req?.query?.id || '') as string).split(',');
    const contentTypeRepository = getRepository(ContentType);

    const contentTypes = await contentTypeRepository.find({
      where: {
        id: In(ids),
      },
    });

    const mapped = contentTypes.map((contentType) => {
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
    res.setHeader(
      'Content-disposition',
      `attachment; filename=contentTypes.json`
    );
    res.setHeader('Content-type', 'application/json');
    res.send(mapped);
  })
);

app.get(
  '/content-types/single',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const name = req?.query?.name;

    const contentTypeRepository = getRepository(ContentType);

    const qb = contentTypeRepository
      .createQueryBuilder('contentType')
      .leftJoinAndSelect('contentType.author', 'author')
      .leftJoinAndSelect('author.meta', 'author.meta');

    if (name) {
      qb.andWhere('contentType.name = :name', {
        name
      })
    }

    const contentType = await qb.getOne();

    if (!contentType) throw new BadRequestError('invalid_content_type');

    res.send(mapContentType(contentType));
  })
)

app.get(
  '/content-types/:contentTypeId',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const contentTypeRepository = getRepository(ContentType);

    const contentType = await contentTypeRepository.findOne({
      id: req.params.contentTypeId,
    });
    if (!contentType) throw new BadRequestError('invalid_content_type');
    res.send(mapContentType(contentType));
  })
);

// Content types
const fields = [
  {
    type: 'richtext',
    name: 'Rich Text',
    component: './richtext.tsx',
    iconProps: { iconName: 'FabricTextHighlight' },
    group: 'Core',
  },
  {
    type: 'number',
    name: 'Number',
    iconProps: { iconName: 'NumberField' },
    group: 'Core',
    fields: [
      {
        name: 'required',
        type: 'checkbox',
        label: 'Required',
      },
      {
        name: 'defaultValue',
        type: 'number',
        label: 'Default',
      },
    ],
  },
  {
    type: 'choicegroup',
    name: 'Choice Group',
    iconProps: { iconName: 'RadioBtnOn' },
    group: 'Core',
    fields: [
      {
        name: 'options',
        type: 'text',
        multiline: true,
        placeholder: 'green\nred\nblue',
        label: 'Options',
      },
      {
        name: 'defaultValue',
        type: 'text',
        label: 'Default',
      },
    ],
  },
  {
    type: 'dropdown',
    name: 'Dropdown',
    iconProps: { iconName: 'Dropdown' },
    group: 'Core',
    fields: [
      {
        name: 'options',
        type: 'text',
        multiline: true,
        placeholder: 'green\nred\nblue',
        label: 'Options',
      },
      {
        name: 'defaultValue',
        type: 'text',
        label: 'Default',
      },
      {
        name: 'multiSelect',
        type: 'checkbox',
        label: 'Multi Select',
      },
    ],
  },
  {
    type: 'checkbox',
    name: 'Checkbox',
    iconProps: { iconName: 'CheckboxComposite' },
    group: 'Core',
    fields: [
      {
        name: 'defaultValue',
        type: 'choicegroup',
        defaultValue: 'false',
        label: 'Default',
        options: 'true\nfalse',
      },
    ],
  },
  {
    type: 'colorpicker',
    name: 'Color Picker',
    iconProps: { iconName: 'Eyedropper' },
    group: 'Core',
  },
  {
    type: 'datepicker',
    name: 'Date Picker',
    iconProps: { iconName: 'CalendarWeek' },
    group: 'Core',
  },
  {
    type: 'images',
    name: 'Images',
    iconProps: { iconName: 'FileImage' },
    group: 'Core',
    fields: [
      {
        name: 'multiSelect',
        type: 'checkbox',
        label: 'Multi Select',
      },
    ],
  },
  {
    type: 'assets',
    name: 'Assets',
    iconProps: { iconName: 'Document' },
    group: 'Core',
    fields: [
      {
        name: 'multiSelect',
        type: 'checkbox',
        label: 'Multi Select',
      },
    ],
  },
  {
    type: 'relation',
    name: 'Relation',
    iconProps: { iconName: 'Relationship' },
    group: 'Core',
    fields: [
      {
        type: 'post_type_dropdown',
        name: 'posts',
        multiSelect: true,
        label: 'Allowed post types',
        rules: {
          required: 'Field is required',
        },
      },
    ],
  },
  {
    type: 'group',
    name: 'Group',
    iconProps: { iconName: 'ViewListTree' },
    group: 'Layout',
  },
  {
    type: 'repeatable',
    name: 'Repeatable',
    iconProps: { iconName: 'ViewList' },
    group: 'Layout',
    fields: [
      {
        name: 'max',
        type: 'number',
        label: 'Maximum Items',
      },
    ],
  },
  {
    type: 'tab',
    name: 'Tab',
    iconProps: { iconName: 'TabCenter' },
    group: 'Layout',
  },
  {
    type: 'zone',
    name: 'Dynamic Zone',
    iconProps: { iconName: 'Add' },
    group: 'Layout',
    fields: [
      {
        type: 'components_dropdown',
        name: 'components',
        label: 'Allowed components',
        multiSelect: true,
        rules: {
          required: 'Field is required',
        },
      },
    ],
  },
  {
    type: 'custom',
    name: 'Custom Component',
    iconProps: { iconName: 'Add' },
    group: 'Core',
    fields: [
      {
        type: 'components_dropdown',
        name: 'component',
        label: 'Component',
        rules: {
          required: 'Field is required',
        },
      },
    ],
  },
  {
    type: 'text',
    name: 'Text',
    iconProps: { iconName: 'TextField' },
    group: 'Core',
    fields: [
      {
        name: 'required',
        type: 'checkbox',
        label: 'Required',
      },
      {
        name: 'defaultValue',
        type: 'text',
        label: 'Default',
      },
      {
        name: 'multiline',
        type: 'checkbox',
        label: 'Multiline',
      },
    ],
  },
];

const mapComponent = (component) => {
  return {
    id: component.id,
    name: component.name,
    type: 'component',
    group: 'Custom Components',
  };
};

app.get(
  '/components',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const contentTypeRepository = getRepository(ContentType);
    const contentTypes = await contentTypeRepository.find({
      type: 'component',
    });

    res.send(contentTypes.map(mapComponent));
  })
);

app.get(
  '/fields',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const allFields = await Hooks.applyFilters('contentType/fields', [
      ...fields,
    ]);
    res.send(allFields);
  })
);

app.get(
  '/fields/:fieldType',
  authMiddleware(),
  asyncMiddleware(async (req, res) => {
    const allFields = await Hooks.applyFilters('contentType/fields', [
      ...fields,
    ]);
    const field = allFields.find(
      (field) => field.type === req.params.fieldType
    );
    if (!field) throw new BadRequestError('invalid_field_type');
    res.send(field);
  })
);

export default app;
