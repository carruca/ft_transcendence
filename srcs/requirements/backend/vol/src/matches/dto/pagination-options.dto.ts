import { IsNumber } from 'class-validator';

export class PaginationOptionsDto {
  @IsNumber()
	limit: number;

  @IsNumber()
	page: number;
}
