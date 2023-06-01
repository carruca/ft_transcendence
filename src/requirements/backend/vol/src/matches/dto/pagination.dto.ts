export class PaginationDto<EntityType> {
	results: EntityType[];
	currentPage: number;
	total: number;
}
