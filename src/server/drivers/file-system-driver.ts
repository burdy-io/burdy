import path from 'path';
import fse from 'fs-extra';
import multer from 'multer';
import { IFileDriver } from '@server/drivers/file.driver';
import logger from '@shared/features/logger';
import PathUtil from '@scripts/util/path.util';

export default class FileSystemDriver implements IFileDriver {
  private dir = process.env.FS_UPLOAD_FOLDER || PathUtil.burdyRoot('upload');
  private provider = 'fs';

  constructor() {
    fse.ensureDirSync(this.dir);
  }

  getUpload = () => multer({ dest: this.dir });

  getPath = (key: string) => path.join(`${this.dir}`, key);

  getName = () => this.provider;

  write = async (key: string, data: any) => {
    await fse.writeFile(this.getPath(key), data);
    return {
      key,
      provider: this.provider,
    };
  };

  createReadStream = (key: string, options: any) =>
    fse.createReadStream(this.getPath(key), options);

  createWriteStream = (key: string, options: any) =>
    fse.createWriteStream(this.getPath(key), options);

  stat = async (key: string): Promise<any> => {
    const stat = await fse.stat(this.getPath(key));
    if (stat) {
      return {
        ...stat,
        contentLength: stat.size,
      };
    }
    return stat;
  };

  read = async (key: string) => {
    const data = await fse.readFile(this.getPath(key));
    return data;
  };

  delete = async (params: string | string[]) => {
    if (params) {
      if (Array.isArray(params)) {
        await Promise.all(
          params.map(async (doc) => {
            try {
              await fse.unlink(this.getPath(doc));
            } catch (err) {
              logger.error({
                type: 'assets',
                message: `Unable to delete file: ${doc}`,
                data: err.toString(),
              });
            }
          })
        );
      } else {
        try {
          await fse.unlink(this.getPath(params));
        } catch (err) {
          logger.error({
            type: 'assets',
            message: `Unable to delete file: ${params}`,
            data: err.toString(),
          });
        }
      }
    }
  };

  copy = (src: string, dest: string) =>
    fse.copyFile(this.getPath(src), this.getPath(dest));
}
