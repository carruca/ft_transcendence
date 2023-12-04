import {
  IsArray,
  IsNumber,
} from 'class-validator';

export class PaginationDto<EntityType> {
  @IsArray()
	results: EntityType[];

  @IsNumber()
	currentPage: number;

  @IsNumber()
	total: number;
}
