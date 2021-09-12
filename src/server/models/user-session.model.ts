import {
  BaseEntity,
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import User from '@server/models/user.model';

@Entity()
@Index(['user'])
export default class UserSession extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  expiresAt: Date;

  @ManyToOne(() => User, (user) => user.sessions, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user: User;
}
