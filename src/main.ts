import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiExceptionFilter } from './filters/api-exception.filter';
import { ElapsedTimeInterceptor } from './interceptors/interceptor';
import { PublicCacheInterceptor } from './interceptors/etag-interceptor';
import SuperTokens from 'supertokens-node';
import { errorHandler } from 'supertokens-node/framework/express';

const hbs = require('hbs');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: process.env.SUPERTOKENS_WEBSITE_DOMAIN || 'http://localhost:3000',
    allowedHeaders: ['content-type', ...SuperTokens.getAllCORSHeaders()],
    credentials: true,
  });
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({}));
  app.useGlobalInterceptors(new ElapsedTimeInterceptor(), new PublicCacheInterceptor());
  app.useStaticAssets(join(process.cwd(), 'public'));
  app.setBaseViewsDir(join(process.cwd(), 'views'));
  app.setViewEngine('hbs');
  hbs.registerPartials(join(process.cwd(), 'views', 'partials'));
  hbs.registerHelper('ifEquals', function (a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this);
  });
  const config = new DocumentBuilder()
    .setTitle('Kino API')
    .setDescription('REST API для онлайн-кинотеатра Kino')
    .addCookieAuth('sAccessToken', {
      type: 'apiKey',
      in: 'cookie',
      name: 'sAccessToken',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true, },
  });
  app.use(errorHandler());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
