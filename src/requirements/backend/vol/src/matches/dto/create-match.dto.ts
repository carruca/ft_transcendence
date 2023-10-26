import {
  IsString,
  IsDate,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UserStats {
	id: number; // FIXME this should be the username (string)
	score: number;
	winRatio: number; // no tienes que trabajar con el ella, la voy a modificar yo pero quiero que se copie desde el User que la tendra almacenada en la db.
	rivalScore: number; // score del rival
	rivalWinRatio: number; // lo mismo que el winratio
	comeBack: boolean; // remontar 3 puntos 
	doubleTap: number; // marca dos puntos seguidos en 10 segundos
	blocker: number; // bloquea 10 disparos consecutivos al oponente
	winningStreak: boolean; // mete 5 puntos seguidos
	firstPoint: boolean; // consigue el primer punto en el partido
	precision: number; // marca un punto colocando un punto justo en la esquina de la portería
}

export class CreateMatchDto {
  @IsString()
	mode: string;

  @IsDate()
	start: Date;

  @IsDate()
	end: Date;

  @IsArray()
  @Type(() => UserStats)
	winners: Array<UserStats>;

  @IsArray()
  @Type(() => UserStats)
	losers: Array<UserStats>;
}
