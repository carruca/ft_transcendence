import { IsString, IsNumber } from 'class-validator';
export class CreateUserDto {
	@IsNumber()
  id: number;

	@IsString()
  name: string;

	@IsString()
  login: string;
}
