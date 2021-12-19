import { FindManyOptions } from 'typeorm';

export enum UserStatus {
  ACTIVE = 'active',
  NOT_ACTIVATED = 'not_activated',
  DISABLED = 'disabled',
}

export enum UserTokenType {
  RESET = 'reset',
  ACTIVATE = 'activate',
}

export interface IUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  meta: IUserMeta[];
  sessions: IUserSession[];
  tokens: IUserToken[];
  groups: IGroup[];
}

export interface IUserMeta {
  id: number;
  key: string;
  value: string;
  user: IUser;
}

export interface IUserSession {
  id: number;
  expiresAt: Date;
  user: IUser;
}

export interface IUserToken {
  id: number;
  token: string;
  data: any;
  expiresAt: Date;
  type: UserTokenType;
  user: IUser;
}

export interface IOption<T> {
  perPage: number;
  page: number;
  query?: FindManyOptions<T>;
}

export interface IPage<T> {
  results: T[];
  paginate: {
    total: number;
    current: number;
    pageSize: number;
  };
}

export interface IAssetMeta {
  id?: number;
  key: string;
  value: string;
  asset?: IAsset;
}

export interface IAsset {
  id: number;
  name: string;
  provider?: string;
  document?: string;
  mimeType?: string;
  contentLength?: number;
  createdAt: Date;
  updatedAt: Date;
  parent?: IAsset;
  parentId?: number;
  children?: IAsset[];
  ancestors?: IAsset[];
  meta?: IAssetMeta[];
  tags?: ITag[];
  thumbnail?: string;
  npath?: string;
}

export interface ITagMeta {
  id: number;
  key: string;
  value: string;
  tag?: ITag;
}

export interface ITag {
  id: number;
  name: string;
  slug: string;

  createdAt: Date;
  updatedAt: Date;
  parent?: ITag;
  parentId?: number;
  author: IUser;

  meta?: ITagMeta[];
  slugPath?: string;
}

export interface IPostMeta {
  id?: number;
  key: string;
  value: string;
  post?: IPost;
}

export interface IPost {
  id: number;
  name?: string;
  slug?: string;
  type?: string;
  createdAt?: Date;
  updatedAt?: Date;
  publishedAt?: Date;
  publishedFrom?: Date;
  publishedUntil?: Date;
  status?: string;
  parent?: IPost;
  parentId?: number;
  content?: any;
  meta?: IPostMeta[];
  children?: IPost[];
  ancestors?: IPost[];
  author?: IUser;
  slugPath?: string;
  tags?: ITag[];
  contentTypeId?: number;
  contentType?: IContentType;
  versionId?: number;
}

export interface IContentType {
  id: number;
  name: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  fields?: any[];
}

export interface IGroup {
  id: number;
  name: string;
  permissions: string[];
  protected: boolean;
  description?: string;
  users?: IUser[];
}

export enum IBackupState {
  PENDING = 'pending',
  READY = 'ready'
}

export interface IBackup {
  id: number;
  name: string;
  document: string;
  provider: string;
  state: IBackupState;
  createdAt: Date;
  includes: string[];
}

export interface IAccessToken {
  id: number;
  token: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISiteSettings {
  id: number;
  key?: string;
  value?: string;
}
