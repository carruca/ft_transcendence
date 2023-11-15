import { IsString, IsNumber } from 'class-validator';
export class CreateUserDto {
	@IsNumber()
  intraId: number;

	@IsString()
  displayname: string;

	@IsString()
  login: string;

	@IsString()
	nickname?: string;
}
