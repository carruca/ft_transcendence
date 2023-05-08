export interface UserScore {
	id: number;
	score: number;
}

export class CreateMatchDto {
	mode: string;
	start: Date;
	end: Date;
	users: Array<UserScore>;
}
