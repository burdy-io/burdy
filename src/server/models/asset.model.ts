/**
 * Models are backend blabla
 *
 * @packageDocumentation
 * @module Models
 * @preferred
 */
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import AssetMeta from '@server/models/asset-meta.model';
import { IAsset } from '@shared/interfaces/model';
import User from './user.model';
import Tag from './tag.model';

@Entity()
@Tree('materialized-path')
export default class Asset extends BaseEntity implements IAsset {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  @Index()
  name: string;

  @Column({ nullable: true })
  provider?: string;

  @Column({ nullable: true })
  document?: string;

  @Column({ nullable: true })
  mimeType?: string;

  @Column({ nullable: true })
  contentLength?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @TreeParent({
    onDelete: 'CASCADE'
  })
  parent?: Asset;

  @Column({ nullable: true })
  parentId?: number;

  @ManyToOne(() => User, {
    onDelete: 'NO ACTION',
  })
  author: User;

  @TreeChildren({ cascade: ['insert', 'remove', 'update'] })
  children?: Asset[];

  @OneToMany(() => AssetMeta, (assetMeta) => assetMeta.asset, {
    cascade: ['insert', 'remove', 'update'],
    eager: true,
  })
  meta?: AssetMeta[];

  @Column({ nullable: true, unique: true })
  npath?: string;

  @Column({ nullable: true, insert: false, update: false, select: false })
  thumbnail?: string;

  @ManyToMany(() => Tag)
  @JoinTable()
  tags: Tag[];

  static getAncestorsList(entity: Asset): Asset[] {
    if (!entity?.id) {
      return [];
    }
    let result: Asset[] = [];
    result.push(entity);
    if (entity.parent) {
      result = [...result, ...this.getAncestorsList(entity.parent)];
    }
    return result;
  }
}
