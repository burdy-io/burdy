import AwsS3FileDriver from '@server/drivers/aws-s3-driver';
import FileSystemDriver from '@server/drivers/file-system-driver';

export interface IFileDriver {
  getUpload: () => any;
  getName: () => string;
  getPath: (key: string) => string;

  copy: (src: string, dest: string) => Promise<any>;
  write: (key: string, content: any) => Promise<any>;
  read: (key: string) => Promise<any>;
  stat: (key: string) => Promise<any>;
  delete: (params: string | string[]) => Promise<any>;

  createReadStream: (key: string, options?: any) => any;
  createWriteStream: (key: string, options?: any) => any;
}

export default class FileDriver implements IFileDriver {
  private static instance: IFileDriver;

  private implementation: IFileDriver;

  constructor() {
    if (process.env.FILE_DRIVER === 'aws_s3') {
      this.implementation = new AwsS3FileDriver();
    } else {
      this.implementation = new FileSystemDriver();
    }
  }

  public static getInstance(): IFileDriver {
    if (!FileDriver.instance) {
      FileDriver.instance = new FileDriver();
    }
    return FileDriver.instance;
  }

  getUpload = () => this.implementation.getUpload();
  getPath = (key: string) => this.implementation.getPath(key);
  getName = () => this.implementation.getName();
  copy = (src: string, dest: string) => this.implementation.copy(src, dest);
  write = (key: string, content: any) => this.implementation.write(key, content);
  read = (key: string) => this.implementation.read(key);
  stat = (key: string) => this.implementation.stat(key);
  delete = (params: string | string[]) => this.implementation.delete(params);

  createReadStream = (key: string, options?: any) =>
    this.implementation.createReadStream(key, options);

  createWriteStream = (key: string, options?: any) =>
    this.implementation.createWriteStream(key, options);
}
