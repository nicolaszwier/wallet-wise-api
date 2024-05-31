import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({ origin: '*' });

  console.log("deployment test");
  
  await app.listen(process.env.PORT || 3000);
}

bootstrap();
