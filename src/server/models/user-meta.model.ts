import {
  BaseEntity,
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import User from '@server/models/user.model';
import { IUserMeta } from '@shared/interfaces/model';

@Entity()
@Index(['key', 'user'], { unique: true })
export default class UserMeta extends BaseEntity implements IUserMeta {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  @Index()
  key: string;

  @Column({type: 'text', nullable: true})
  value: any;

  @ManyToOne(() => User, (user) => user.meta, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user: User;
}
