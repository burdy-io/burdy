import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IBackup, IBackupState } from '@shared/interfaces/model';

@Entity()
export default class Backup extends BaseEntity implements IBackup {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  document: string;

  @Column('simple-array', { nullable: true })
  includes: string[] | null;

  @Column()
  name: string;

  @Column()
  provider: string;

  @Column('text')
  state: IBackupState;
}
