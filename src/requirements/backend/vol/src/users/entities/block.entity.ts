import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity()
export class Block {
  constructor(
    userId: string,
    blockId: string
  ){
    this.userId = userId;
    this.blockId = blockId;
  }
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  blockId: string;
}
