import {
  BaseEntity,
  Column, CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn, UpdateDateColumn
} from 'typeorm';
import { IAccessToken } from '@shared/interfaces/model';

@Entity()
export default class AccessToken extends BaseEntity implements IAccessToken {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  @Index()
  token: string;

  @Column({type: 'text', nullable: true})
  name: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
