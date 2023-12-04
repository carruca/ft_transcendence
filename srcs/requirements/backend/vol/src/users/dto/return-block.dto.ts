import { IsString } from 'class-validator';

export class ReturnBlockDto {
  @IsString()
  id: string;

  @IsString()
  userId: string;

  @IsString()
  blockId: string;
}
