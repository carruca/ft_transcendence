import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';

import { User } from './user.entity';

@Entity()
export class Block {
  constructor(
    user: User,
    blockId: string
  ){
    this.user = user;
    this.blockId = blockId;
  }
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  blockId: string;

  @ManyToOne(() => User, (user) => user.blocks, {
    onDelete: 'CASCADE'
  })
  user: User;
}
