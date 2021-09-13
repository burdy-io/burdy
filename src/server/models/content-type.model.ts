/**
 * @packageDocumentation
 * @module Models
 */
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IContentType } from '@shared/interfaces/model';
import User from './user.model';
import Post from './post.model';

@Entity()
export default class ContentType extends BaseEntity implements IContentType {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column('text', { nullable: true })
  fields: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true
  })
  author: User;

  @OneToMany(() => Post, (post) => post.contentType, {
    cascade: ['insert', 'remove', 'update'],
  })
  posts?: Post[];
}
