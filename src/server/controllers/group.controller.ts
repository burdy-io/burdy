import express from 'express';
import asyncMiddleware from '@server/middleware/async.middleware';
import { getManager, In } from 'typeorm';
import Group from '@server/models/group.model';
import _ from 'lodash';
import {
  createRelationsArray,
  getEnhancedRepository,
} from '@server/common/orm-helpers';
import * as yup from 'yup';
import NotFoundError from '@server/errors/not-found-error';
import authMiddleware from '@server/middleware/auth.middleware';
import { IUser } from '@shared/interfaces/model';

const app = express();

app.get(
  '/groups',
  authMiddleware(['users_administration']),
  asyncMiddleware(async (req, res) => {
    const groups = await Group.find({
      relations: createRelationsArray(req.query?.expand),
    });

    res.send(groups);
  })
);

app.get(
  '/groups/:id',
  authMiddleware(['users_administration']),
  asyncMiddleware(async (req, res) => {
    const group = await Group.findOne({
      relations: createRelationsArray(req.query?.expand),
      where: { id: req.params.id },
    });

    res.send(group);
  })
);

app.post(
  '/groups',
  authMiddleware(['users_administration']),
  asyncMiddleware(async (req, res) => {
    const group = _.pick(req.body, ['name', 'permissions', 'description']);

    await req.validate({
      name: yup
        .string()
        .required()
        .test('name-exists', 'Name exists.', async () => {
          const existingGroup = await Group.findOne({ name: group.name });
          return existingGroup === undefined;
        }),
      permissions: yup.array(),
      description: yup.string(),
      userIds: yup.array(),
    });

    const users: IUser[] = req.body?.users ?? [];
    const userIds = users.map((u) => u.id);

    await getManager().transaction(async (entityManager) => {
      const groupRepository = getEnhancedRepository(Group, entityManager);
      const record = await groupRepository.save(group);

      if (Array.isArray(userIds)) {
        await groupRepository.attach(record.id, 'users', userIds);
      }

      res.send(record);
    });
  })
);

app.put(
  '/groups/:id',
  authMiddleware(['users_administration']),
  asyncMiddleware(async (req, res) => {
    const id = req.params?.id;
    const group = _.pick(req.body, ['name', 'permissions', 'description']);
    const groupModel = await Group.findOne({ id });

    if (!groupModel) throw new NotFoundError('not_found');

    await req.validate({
      name: yup
        .string()
        .required()
        .test('name-exists', 'Name exists.', async () => {
          const existingGroup = await Group.findOne({ name: group.name });
          return existingGroup === undefined || existingGroup.id === Number(id);
        }),
      permissions: yup.array(),
      description: yup.string(),
      userIds: yup.array(),
    });

    const users: IUser[] = req.body?.users ?? [];
    const userIds = users.map((u) => u.id);

    // Protect auth from removing themselves from the protected group
    if (
      Array.isArray(userIds) &&
      groupModel.protected &&
      _.map(groupModel.users, 'id').includes(req.data.user.id) &&
      !userIds.includes(req.data.user.id)
    ) {
      userIds.push(req.data.user.id);
    }

    await getManager().transaction(async (entityManager) => {
      const groupRepository = getEnhancedRepository(Group, entityManager);
      await groupRepository.update({ id, protected: false }, group);

      if (Array.isArray(userIds)) {
        await groupRepository.sync(id, 'users', userIds);
      }

      const groupResponse = await groupRepository.findOne({ where: { id } });
      res.send(groupResponse);
    });
  })
);

app.delete(
  '/groups',
  authMiddleware(['users_administration']),
  asyncMiddleware(async (req, res) => {
    const groupRepository = getEnhancedRepository(Group);
    await groupRepository.delete({
      id: In(req.body?.ids ?? []),
      protected: false,
    });

    res.send();
  })
);

app.delete(
  '/groups/:id',
  authMiddleware(['users_administration']),
  asyncMiddleware(async (req, res) => {
    const groupRepository = getEnhancedRepository(Group);
    const group = await groupRepository.findOne({
      id: req.params?.id,
      protected: false,
    });

    if (!group) throw new NotFoundError('not_found');

    await group.remove();

    res.send();
  })
);

export default app;
