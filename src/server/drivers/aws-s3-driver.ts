import { IFileDriver } from '@server/drivers/file.driver';
import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { v4 as uuidv4 } from 'uuid';
import stream from 'stream';

export default class AwsS3FileDriver implements IFileDriver {
  private provider = 's3';
  private dir = process.env.AWS_S3_FOLDER || 'burdy/upload';

  private bucket: string = process.env.AWS_S3_BUCKET;
  private region: string = process.env.AWS_S3_REGION;

  private s3: any;

  constructor() {
    const options: AWS.S3.Types.ClientConfiguration = {
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    }

    if (process.env.AWS_S3_ENDPOINT) {
      options.endpoint = new AWS.Endpoint(process.env.AWS_S3_ENDPOINT);
    }

    this.s3 = new AWS.S3(options);
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

  getKey = (key: string = '') => {
    if (key.indexOf('/') > -1) {
      return this.getPath(key.split('/').pop());
    }
    return this.getPath(key);
  };

  write = async (key: string, data: any) => {
    await this.s3
      .putObject({
        Key: this.getKey(key),
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
        Key: this.getKey(key),
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
          Key: this.getKey(key),
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
        Key: this.getKey(key),
        Bucket: this.bucket,
        Range: options?.range,
      })
      .createReadStream();

  createWriteStream = (key: string) => {
    const pass = new stream.PassThrough();
    this.s3.upload({ Bucket: this.bucket, Key: this.getKey(key), Body: pass });
    return pass;
  };

  uploadReadableStream = async (key: string, stream: any) => {
    return this.s3
      .upload({ Bucket: this.bucket, Key: this.getKey(key), Body: stream })
      .promise();
  };

  delete = async (params: string | string[]) => {
    if (params) {
      if (Array.isArray(params)) {
        const deleteParams = {
          Bucket: this.bucket,
          Delete: { Objects: [] },
        };

        params.forEach((key) => {
          deleteParams.Delete.Objects.push({ Key: this.getKey(key) });
        });
        return await this.s3.deleteObjects(deleteParams).promise();
      }
      return await this.s3
        .deleteObject({
          Key: this.getKey(params),
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
        CopySource: this.getKey(src),
      })
      .promise();

    return {
      dest,
    };
  };
}
