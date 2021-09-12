import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import UserMeta from '@server/models/user-meta.model';
import UserSession from '@server/models/user-session.model';
import UserToken from '@server/models/user-token.model';
import { IUser, UserStatus } from '@shared/interfaces/model';
import Group from '@server/models/group.model';
import _ from 'lodash';
import { compare, compareSync, hash, hashSync } from '@server/common/crypto';

@Entity()
export default class User extends BaseEntity implements IUser {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  @Index({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ length: 64, type: 'varchar', default: UserStatus.ACTIVE })
  status: UserStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => Group, (group) => group.users, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  groups: Group[];

  @OneToMany(() => UserMeta, (userMeta) => userMeta.user, { cascade: true })
  meta: UserMeta[];

  @OneToMany(() => UserSession, (session) => session.user, { cascade: true })
  sessions: UserSession[];

  @OneToMany(() => UserToken, (userToken) => userToken.user, { cascade: true })
  tokens: UserToken[];

  @BeforeInsert()
  @BeforeUpdate()
  sanitizeEmail() {
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
    }
  }

  applyMeta(meta: object) {
    const metaObject = _.keyBy(this.meta, 'key');

    Object.keys(meta ?? {}).forEach((key) => {
      const value = meta?.[key];

      if (value === undefined) {
        return;
      }

      if (metaObject?.[key]) {
        metaObject[key].value = value;
      } else {
        metaObject[key] = { key, value } as any;
      }
    });

    this.meta = _.values(metaObject);
  }

  comparePasswordSync(password: string) {
    return compareSync(password, this.password);
  }

  async comparePassword(password: string) {
    return compare(password, this.password);
  }

  setPasswordSync(password: string) {
    this.password = hashSync(password);
  }

  async setPassword(password: string) {
    this.password = await hash(password);
  }
}
