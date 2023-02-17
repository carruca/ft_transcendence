import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

	@Get('/42')
	getFile(@Res() res: Response) {
		const file = createReadStream(join(process.cwd(), 'index.html'));
		file.pipe(res);
	}
}
