'use strict'
require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

try {
  (async () => {
    const app = await NestFactory.create(AppModule);

    const config = new DocumentBuilder()
    .setTitle('ft_transcendence API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addTag('auth')
    .addCookieAuth('token')
    .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/docs/api', app, document);

    app.use(cookieParser(process.env.NEST_COOKIE_SECRET));
    app.enableCors({
      credentials: true,
      origin: process.env.NEST_FRONT_URL,
    });

    await app.listen(process.env.NEST_PORT || 3000);
  })();
} catch (error) {
  console.error(error);
}
