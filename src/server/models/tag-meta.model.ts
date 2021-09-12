import {
  BaseEntity,
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { ITag, ITagMeta } from '@shared/interfaces/model';
import Tag from './tag.model';

@Entity()
@Index(['key', 'tagId'], { unique: true })
export default class TagMeta extends BaseEntity implements ITagMeta {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  @Index()
  key: string;

  @Column({ type: 'text' })
  value: string;

  @ManyToOne(() => Tag, (tag) => tag.meta, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  tag: ITag;

  @Column()
  tagId: number;
}
