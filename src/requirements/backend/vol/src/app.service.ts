import { Injectable, Param } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello Worldam!';
  }

  getUser(id: string): string {
  	return 'user ' + id;
  }
}
