export class PaginationDto<EntityType> {
	data: EntityType[];
	currentPage: number;
	total: number;
}
