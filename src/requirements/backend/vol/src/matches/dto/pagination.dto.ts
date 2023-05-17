export class PaginationDto<Entity> {
	data: Entity[];
	currentPage: number;
	total: number;
}
