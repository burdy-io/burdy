import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
  UpdateDateColumn
} from 'typeorm';
import { IContentType, IPost, IPostMeta } from '@shared/interfaces/model';
import PostMeta from './post-meta.model';
import User from './user.model';
import ContentType from './content-type.model';
import Tag from './tag.model';

@Entity()
@Tree('materialized-path')
export default class Post extends BaseEntity implements IPost {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ unique: true })
  slugPath: string;

  @Column()
  type: string;

  @Column({ nullable: true })
  contentTypeId?: number;

  @ManyToOne(() => ContentType, (contentType) => contentType.posts, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  contentType?: IContentType;

  @Column('text', { nullable: true })
  content: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true, default: 'draft' })
  status?: string;

  @Column({ nullable: true })
  publishedAt?: Date;

  @Column({ nullable: true })
  publishedFrom?: Date;

  @Column({ nullable: true })
  publishedUntil?: Date;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true
  })
  author: User;

  @TreeParent({
    onDelete: 'CASCADE'
  })
  parent?: IPost;

  @Column({ nullable: true })
  parentId?: number;

  @TreeChildren({ cascade: ['insert', 'remove', 'update'] })
  children?: IPost[];

  @OneToMany(() => PostMeta, (postMeta) => postMeta.post, {
    cascade: ['insert', 'remove', 'update']
  })
  meta: IPostMeta[];

  @ManyToMany(() => Tag)
  @JoinTable()
  tags: Tag[];

  static getAncestorsList(entity: IPost): IPost[] {
    if (!entity?.id) {
      return [];
    }
    let result: IPost[] = [];
    result.push(entity);
    if (entity.parent) {
      result = [...result, ...this.getAncestorsList(entity.parent)];
    }
    return result;
  }
}
