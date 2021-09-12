/**
 * @packageDocumentation
 * @module Models
 */
import {
  BaseEntity,
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { IAssetMeta } from '@shared/interfaces/model';
import Asset from '@server/models/asset.model';

@Entity()
@Index(['key', 'asset'], { unique: true })
export default class AssetMeta extends BaseEntity implements IAssetMeta {
  constructor(obj: IAssetMeta) {
    super();
    this.key = obj?.key;
    this.value = obj?.value;
  }

  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  @Index()
  key: string;

  @Column({ type: 'text' })
  value: string;

  @ManyToOne(() => Asset, (asset) => asset.meta, { onDelete: 'CASCADE' })
  asset: Asset;
}
