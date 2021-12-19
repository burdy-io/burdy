import {
  BaseEntity,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ISiteSettings } from '@shared/interfaces/model';

@Entity()
export default class SiteSettings extends BaseEntity implements ISiteSettings{
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index({ unique: true })
  @Column()
  key: string;

  @Column({type: 'text'})
  value: any;
}
