import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
//  const app1 = await NestFactory.create(AppModule);
//  await app1.listen(22);
}
bootstrap();
