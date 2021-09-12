import {
  BaseEntity,
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IPostMeta } from '@shared/interfaces/model';
import Post from './post.model';

@Entity()
@Index(['key', 'post'], { unique: true })
export default class PostMeta extends BaseEntity implements IPostMeta {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  @Index()
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @ManyToOne(() => Post, (post) => post.meta, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  post: Post;
}
