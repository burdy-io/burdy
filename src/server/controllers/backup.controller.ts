import express from 'express';
import authMiddleware from '@server/middleware/auth.middleware';
import asyncMiddleware from '@server/middleware/async.middleware';
import {getEnhancedRepository} from '@server/common/orm-helpers';
import Backup from '@server/models/backup.model';
import {getManager} from "typeorm";
import {v4 as uuid} from 'uuid';
import {IBackupState} from "@shared/interfaces/model";
import FileDriver from "@server/drivers/file.driver";
import {runAsync} from "@server/common/async";
import {exportContent} from "@server/business-logic/server.bl";
import PathUtil from "@scripts/util/path.util";
import fs from 'fs-extra';
import DeferPromise from 'defer-promise';
import NotFoundError from "@server/errors/not-found-error";
import BadRequestError from "@server/errors/bad-request-error";

const app = express();

app.get(
  '/backups',
  authMiddleware(['all']),
  asyncMiddleware(async (req, res) => {
    const backupRepository = getEnhancedRepository(Backup);
    const backups = await backupRepository.find({});

    res.send(backups);
  })
);

app.post(
  '/backups',
  authMiddleware(['all']),
  asyncMiddleware(async (req, res) => {
    await getManager().transaction(async (entityManager) => {
      const backupRepository = getEnhancedRepository(Backup, entityManager);
      const pendingBackups = await backupRepository.count({ where: { state: IBackupState.PENDING } });

      if (pendingBackups > 0) throw new BadRequestError('backup_running');

      const backup = backupRepository.create();
      backup.name = uuid();
      backup.document = `export-${backup.name}`;
      backup.state = IBackupState.PENDING;
      backup.provider = FileDriver.getInstance().getName();

      const backupModel = await backupRepository.save(backup);

      runAsync(async () => {
        const fsOutput = PathUtil.burdyRoot('backups', `${backup.name}.zip`);

        try {
          await fs.ensureDir(PathUtil.burdyRoot('backups'));
          await exportContent({output: fsOutput });
          const fsReader = fs.createReadStream(fsOutput);

          const fileDriverWriter = FileDriver.getInstance().createWriteStream(backup.document) as fs.WriteStream;
          const deferred = DeferPromise<void>();

          fileDriverWriter.on('close', deferred.resolve);
          fileDriverWriter.on('error', deferred.reject);
          fsReader.on('error', deferred.reject);

          fsReader.pipe(fileDriverWriter);

          await deferred.promise;
          await fs.remove(fsOutput);

          backup.state = IBackupState.READY;
          await backup.save();
        } catch (e) {
          fs.remove(fsOutput);
          backup.remove();
          FileDriver.getInstance().delete(backup.document);
        }
      });

      res.send(backupModel);
    })
  })
);

app.get(
  '/backups/download/:id',
  authMiddleware(['all']),
  asyncMiddleware(async (req, res) => {
    const backupRepository = getEnhancedRepository(Backup);
    const backup = await backupRepository.findOne({ where: { id: req.params?.id } });

    if (!backup) throw new NotFoundError('not_found');

    if (backup.state === IBackupState.PENDING) throw new BadRequestError('backup_pending');

    const readStream = FileDriver.getInstance().createReadStream(backup.document) as fs.ReadStream;

    res.attachment(`export-${backup.name}-${backup.createdAt.toISOString()}.zip`);
    res.contentType('application/zip');

    readStream.on('end', () => {
      res.end();
    })

    readStream.pipe(res);
  })
);

app.delete(
  '/backups/:id',
  authMiddleware(['all']),
  asyncMiddleware(async (req, res) => {
    const id = req.params?.id;

    const backupRepository = getEnhancedRepository(Backup);
    const backup = await backupRepository.findOne({ where: { id } });

    if (!backup) throw new NotFoundError('not_found');

    await FileDriver.getInstance().delete(backup.document);
    await backupRepository.remove(backup);

    res.send();
  })
);

app.get(
  '/backups/:id',
  authMiddleware(['all']),
  asyncMiddleware(async (req, res) => {
    const id = req.params?.id;

    const backupRepository = getEnhancedRepository(Backup);
    const backup = await backupRepository.findOne({ where: { id } });

    if (!backup) throw new NotFoundError('not_found');

    res.send(backup);
  })
);

export default app;
