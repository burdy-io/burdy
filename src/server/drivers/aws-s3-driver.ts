import { IFileDriver } from '@server/drivers/file.driver';
import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { v4 as uuidv4 } from 'uuid';

export default class AwsS3FileDriver implements IFileDriver {
  private provider = 's3';
  private dir = process.env.AWS_S3_FOLDER || 'burdy/upload';

  private bucket: string = process.env.AWS_S3_BUCKET;
  private region: string = process.env.AWS_S3_REGION;

  private s3: any;

  constructor() {
    this.s3 = new AWS.S3({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  getPath = (key: string) => `${this.dir}/${key}`;

  getUpload = () =>
    multer({
      storage: multerS3({
        s3: this.s3,
        bucket: this.bucket,
        metadata: (_req, file, cb) => {
          cb(null, { fieldName: file.fieldname });
        },
        key: (_req, _file, cb) => {
          cb(null, this.getPath(uuidv4()));
        },
      }),
    });

  getName = () => this.provider;

  write = async (key: string, data: any) => {
    await this.s3
      .putObject({
        Key: key,
        Body: data,
        Bucket: this.bucket,
        CacheControl: 'no-cache',
      })
      .promise();

    return {
      key,
      provider: this.provider,
    };
  };

  stat = async (key: string): Promise<any> => {
    const head = await this.s3
      .headObject({
        Key: key,
        Bucket: this.bucket,
      })
      .promise();
    return {
      contentLength: head.ContentLength,
      cacheControl: head.CacheControl,
      contentType: head.ContentType,
    };
  };

  read = async (key: string) => {
    try {
      const obj = await this.s3
        .getObject({
          Key: key,
          Bucket: this.bucket,
        })
        .promise();
      return obj.Body;
    } catch (err) {
      return null;
    }
  };

  createReadStream = (key: string, options: any) =>
    this.s3
      .getObject({
        Key: key,
        Bucket: this.bucket,
        Range: options?.range,
      })
      .createReadStream();

  createWriteStream = (key: string) =>
    this.s3
      .putObject({
        Key: key,
        Bucket: this.bucket,
      })
      .createWriteStream();

  delete = async (params: string | string[]) => {
    if (params) {
      if (Array.isArray(params)) {
        const deleteParams = {
          Bucket: this.bucket,
          Delete: { Objects: [] },
        };

        params.forEach((Key) => {
          deleteParams.Delete.Objects.push({ Key });
        });
        return await this.s3.deleteObjects(deleteParams).promise();
      }
      return await this.s3
        .deleteObject({
          Key: params,
          Bucket: this.bucket,
        })
        .promise();
    }
    return null;
  };

  copy = async (src: string, dest: string) => {
    await this.s3
      .copyObject({
        Key: dest,
        Bucket: this.bucket,
        CopySource: src,
      })
      .promise();

    return {
      dest,
    };
  };
}
