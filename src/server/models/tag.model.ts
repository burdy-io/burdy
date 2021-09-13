import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
  UpdateDateColumn,
} from 'typeorm';
import type { ITag, ITagMeta } from '@shared/interfaces/model';
import User from './user.model';
import TagMeta from './tag-meta.model';

@Entity()
@Tree('materialized-path')
export default class Tag extends BaseEntity implements ITag {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  @Index()
  name: string;

  @Column()
  slug: string;

  @Column({ unique: true })
  slugPath?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @TreeParent({
    onDelete: 'CASCADE',
  })
  parent?: ITag;

  @Column({ nullable: true })
  parentId?: number;

  @TreeChildren({ cascade: ['insert', 'remove', 'update'] })
  children?: Tag[];

  @OneToMany(() => TagMeta, (tagMeta) => tagMeta.tag, {
    cascade: ['insert', 'remove', 'update'],
  })
  meta: ITagMeta[];

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true
  })
  author: User;

  static getAncestorsList(entity: ITag): ITag[] {
    if (!entity?.id) {
      return [];
    }
    let result: ITag[] = [];
    result.push(entity);
    if (entity.parent) {
      result = [...result, ...this.getAncestorsList(entity.parent)];
    }
    return result;
  }
}
