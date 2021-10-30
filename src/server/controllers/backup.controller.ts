import express from 'express';
import authMiddleware from '@server/middleware/auth.middleware';
import asyncMiddleware from '@server/middleware/async.middleware';
import { getEnhancedRepository } from '@server/common/orm-helpers';
import Backup from '@server/models/backup.model';
import {getManager} from "typeorm";
import { v4 as uuid } from 'uuid';
import {IBackupState} from "@shared/interfaces/model";
import FileDriver from "@server/drivers/file.driver";
import {runAsync} from "@server/common/async";
import { exportContent, importContent } from '@server/business-logic/server.bl';
import PathUtil from "@scripts/util/path.util";
import NotFoundError from "@server/errors/not-found-error";
import BadRequestError from "@server/errors/bad-request-error";
import fse from 'fs-extra';
import logger from '@shared/features/logger';

const app = express();

const getKeyName = (key: string = '') => {
  return key.split('/').pop();
};

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
  '/backups/import',
  authMiddleware(['all']),
  FileDriver.getInstance().getUpload().single('file'),
  asyncMiddleware(async (req, res) => {
    if (!req.file) throw new BadRequestError('invalid_file');

    try {
      let backup: any = {};
      await getManager().transaction(async (entityManager) => {
        const backupRepository = getEnhancedRepository(Backup, entityManager);
        const pendingBackups = await backupRepository.count({
          where: { state: IBackupState.PENDING },
        });

        if (pendingBackups > 0) throw new BadRequestError('backup_running');

        backup.name = uuid();
        backup.state = IBackupState.READY;
        backup.provider = FileDriver.getInstance().getName();
        backup.document = req?.file?.filename || getKeyName(req?.file?.key);

        backup = await backupRepository.save(backup);
      });
      res.send(backup);
    } catch (err) {
      await FileDriver.getInstance().delete(
        req?.file?.filename || getKeyName(req?.file?.key)
      );
      throw err;
    }
  })
);

app.post(
  '/backups/restore',
  authMiddleware(['all']),
  asyncMiddleware(async (req, res) => {
    const { user } = req.data;
    const { id, force } = req.body;

    const backupRepository = getEnhancedRepository(Backup);
    const backup = await backupRepository.findOne({ where: { id } });
    if (!backup) throw new NotFoundError('not_found');

    const writeFile = (document: string): Promise<string> => {
      return new Promise<string>((resolve, reject) => {
        const path = PathUtil.burdyRoot('import.zip');
        const file = fse.createWriteStream(path);
        file.on('close', () => {
          return resolve(path);
        });
        FileDriver.getInstance()
          .createReadStream(document)
          .on('error', (err) => {
            console.log(err);
            reject(err);
          })
          .pipe(file);
      });
    };

    const file = await writeFile(backup.document);
    await importContent({user, file, options: {force}});

    if (await fse.pathExists(file)) {
      await fse.remove(file);
    }

    res.send({
      status: 'ok'
    });
  })
);

app.post(
  '/backups',
  authMiddleware(['all']),
  asyncMiddleware(async (req, res) => {
    await getManager().transaction(async (entityManager) => {
      const backupRepository = getEnhancedRepository(Backup, entityManager);
      const pendingBackups = await backupRepository.count({
        where: { state: IBackupState.PENDING },
      });

      if (pendingBackups > 0) throw new BadRequestError('backup_running');

      const backup = backupRepository.create();
      backup.name = uuid();
      backup.state = IBackupState.PENDING;
      backup.provider = FileDriver.getInstance().getName();

      const backupModel = await backupRepository.save(backup);

      const writeFile = (file: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const key = `export-${backup.name}`;
          const readStream = fse.createReadStream(file);
          logger.info(`Writing new backup file for ${file}.`);
          if (FileDriver.getInstance().getName() === 's3') {
            (FileDriver.getInstance() as any)
              .uploadReadableStream(key, readStream)
              .then(() => {
                logger.info(`Writing new backup ${file} successful, document: ${key}, provider s3.`);
                resolve(key);
              })
              .catch((err) => {
                logger.error(`Writing new backup ${file} failed, provider s3.`);
                logger.error(err);
                reject(err);
              });
          } else {
            const writeStream = FileDriver.getInstance().createWriteStream(key);
            writeStream.on('close', () => {
              logger.info(`Writing new backup for ${file} successful, document: ${key}, provider fs.`);
              return resolve(key);
            });

            readStream
              .on('error', (err) => {
                logger.error(`Writing new backup for ${file} failed, provider fs.`);
                logger.error(err);
                reject(err);
              })
              .pipe(writeStream);
          }
        })
      }

      runAsync(async () => {
        const fsOutput = PathUtil.burdyRoot('backups', `${backup.name}.zip`);

        try {

          await fse.ensureDir(PathUtil.burdyRoot('backups'));
          await exportContent({output: fsOutput });

          const key = await writeFile(fsOutput);

          backup.state = IBackupState.READY;
          backup.document = key;
          await backup.save();
        } catch (e) {
          FileDriver.getInstance().delete(backup.document);
          backup.remove();
        } finally {
          fse.remove(fsOutput);
        }
      });

      res.send(backupModel);
    });
  })
);

app.get(
  '/backups/download/:id',
  authMiddleware(['all']),
  asyncMiddleware(async (req, res) => {
    const backupRepository = getEnhancedRepository(Backup);
    const backup = await backupRepository.findOne({
      where: { id: req.params?.id },
    });

    if (!backup) throw new NotFoundError('not_found');

    if (backup.state === IBackupState.PENDING)
      throw new BadRequestError('backup_pending');

    const readStream = FileDriver.getInstance().createReadStream(
      backup.document
    ) as fse.ReadStream;

    res.attachment(
      `export-${backup.name}-${backup.createdAt.toISOString()}.zip`
    );
    res.contentType('application/zip');

    readStream.on('end', () => {
      res.end();
    });

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

    await backupRepository.remove(backup);
    await FileDriver.getInstance().delete(backup.document);

    res.send({
      id
    });
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
