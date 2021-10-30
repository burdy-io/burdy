import fse from 'fs-extra';
import FileDriver from '@server/drivers/file.driver';
import logger from '@shared/features/logger';

export const driverToFs = (key: string, file: string): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const stream = fse.createWriteStream(file);
    stream.on('close', () => {
      return resolve(file);
    });
    FileDriver.getInstance()
      .createReadStream(key)
      .on('error', (err) => {
        console.log(err);
        reject(err);
      })
      .pipe(stream);
  });
};

export const fsToDriver = (file: string, key: string): Promise<string> => {
  return new Promise((resolve, reject) => {
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
