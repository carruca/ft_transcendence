import {
  IsString,
  IsNumber,
} from 'class-validator';

export class RatingUserDto {
  @IsString()
  nickname: string;

  @IsNumber()
  rating: number;
}
