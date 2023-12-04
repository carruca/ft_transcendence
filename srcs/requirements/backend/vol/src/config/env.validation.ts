import {
  IsString,
  IsNumber,
  validateSync,
} from 'class-validator';
import { plainToInstance } from 'class-transformer';

class EnvironmentVariables {
  @IsString()
  POSTGRES_HOST: string;

  @IsNumber()
  POSTGRES_PORT: number;

  @IsString()
  POSTGRES_USER: string;

  @IsString()
  POSTGRES_PASSWORD: string;

  @IsString()
  POSTGRES_DB: string;
/*
	@IsString()
	FORTYTWO_STRATEGY_CLIENT_ID: string;

	@IsString()
	FORTYTWO_STRATEGY_CLIENT_SECRET: string;

	@IsString()
	JWT_STRATEGY_SECRET_KEY: string;

  @IsNumber()
  PORT: number;
*/
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
