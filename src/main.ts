import { moviePoster } from './movies/movie-poster';
import { ValidationPipe } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
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

export async function configureApp(app: NestExpressApplication) {
  const websiteOrigin = new URL(process.env.SUPERTOKENS_WEBSITE_DOMAIN
    || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000').origin;
  if (process.env.RENDER === 'true') app.set('trust proxy', 1);
  app.enableCors({
    origin: websiteOrigin,
    allowedHeaders: ['content-type', ...SuperTokens.getAllCORSHeaders()],
    credentials: true,
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    let source = req.get('origin');
    if (!source && req.get('referer')) {
      try {
        source = new URL(req.get('referer')!).origin;
      } catch {
        return res.status(403).send('Недопустимый источник запроса');
      }
    }
    const site = req.get('sec-fetch-site');
    const hasSessionCookie = /(?:^|;\s*)(?:sAccessToken|sRefreshToken)=/.test(req.headers.cookie ?? '');
    if ((source && source !== websiteOrigin) || (!source && (hasSessionCookie || (site && site !== 'same-origin')))) {
      return res.status(403).send('Недопустимый источник запроса');
    }
    return next();
  });
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({}));
  app.useGlobalInterceptors(new ElapsedTimeInterceptor(), new PublicCacheInterceptor());
  app.useStaticAssets(join(process.cwd(), 'public'));
  app.setBaseViewsDir(join(process.cwd(), 'views'));
  app.setViewEngine('hbs');
  hbs.registerPartials(join(process.cwd(), 'views', 'partials'));
  hbs.registerHelper('moviePoster', moviePoster);
  hbs.registerHelper('ifEquals', function (a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this);
  });
  const config = new DocumentBuilder()
    .setTitle('Kino API')
    .setDescription('REST API каталога фильмов КИНО')
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
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  await configureApp(app);
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000, process.env.BIND_HOST || '0.0.0.0');
}
if (require.main === module) void bootstrap();
