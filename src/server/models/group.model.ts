import {
  BaseEntity,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IGroup, IUser } from '@shared/interfaces/model';
import User from '@server/models/user.model';

@Entity()
export default class Group extends BaseEntity implements IGroup {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @Column('simple-array')
  permissions: string[];

  @ManyToMany(() => User, (user) => user.groups)
  @JoinTable()
  users: IUser[];

  @Column('boolean', { default: false })
  protected: boolean;
}
