import {
  BaseEntity,
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import User from '@server/models/user.model';
import { UserTokenType } from '@shared/interfaces/model';

@Entity()
export default class UserToken extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ generated: 'uuid' })
  @Index()
  token: string;

  @Column({ type: 'simple-json', nullable: true })
  data: any;

  @Column()
  expiresAt: Date;

  @Column({ type: 'text' })
  type: UserTokenType;

  @ManyToOne(() => User, (user) => user.tokens, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user: User;
}

export { UserTokenType };
