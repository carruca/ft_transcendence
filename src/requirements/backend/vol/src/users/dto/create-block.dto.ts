import { IsString } from 'class-validator';

export class CreateBlockDto {
  @IsString()
  userId: string;

  @IsString()
  blockId: string;
}
