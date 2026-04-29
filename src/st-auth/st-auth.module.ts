import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import SuperTokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import Dashboard from 'supertokens-node/recipe/dashboard';
import { PrismaModule } from '../prisma/prisma.module';
import { StMiddleware } from './middleware/st.middleware';
import { StAuthOptions } from './types/st-auth-options';
import { SuperTokensAuthGuard } from './guards/st-auth.guard';

@Module({})
export class StAuthModule implements NestModule {
  static forRoot(options: StAuthOptions): DynamicModule {
    SuperTokens.init({
      framework: 'express',
      supertokens: {
        connectionURI: options.connectionURI,
        apiKey: options.apiKey,
      },
      appInfo: {
        appName: options.appName,
        apiDomain: options.apiDomain,
        websiteDomain: options.websiteDomain,
        apiBasePath: options.apiBasePath,
        websiteBasePath: options.websiteBasePath,
      },
      recipeList: [
        EmailPassword.init(),
        Session.init({
          getTokenTransferMethod: () => 'cookie',
        }),
        Dashboard.init(),
      ],
    });

    return {
      module: StAuthModule,
      imports: [PrismaModule],
      providers: [SuperTokensAuthGuard],
      exports: [SuperTokensAuthGuard],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(StMiddleware).forRoutes('*');
  }
}