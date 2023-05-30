import { IsString, IsNumber } from 'class-validator';
export class CreateUserDto {
	@IsNumber()
  id: number;

	@IsString()
  displayname: string;

	@IsString()
  login: string;
}
