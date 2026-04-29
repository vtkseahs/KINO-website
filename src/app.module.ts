import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MoviesModule } from './movies/movies.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ProfileModule } from './profile/profile.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PrismaModule } from './prisma/prisma.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { GraphqlComplexityPlugin } from './graphql-complexity.plugin';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StAuthModule } from './st-auth/st-auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, }), MoviesModule, FavoritesModule, ProfileModule, ReviewsModule,PrismaModule,AuthModule, SubscriptionsModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: false,
      introspection: true,
      plugins: [ApolloServerPluginLandingPageLocalDefault(), new GraphqlComplexityPlugin(10)],
    }),
    StAuthModule.forRoot({
      connectionURI: process.env.SUPERTOKENS_CONNECTION_URI!,
      apiKey: process.env.SUPERTOKENS_API_KEY,
      appName: process.env.SUPERTOKENS_APP_NAME || 'Kino',
      apiDomain: process.env.SUPERTOKENS_API_DOMAIN || 'http://localhost:3000',
      websiteDomain: process.env.SUPERTOKENS_WEBSITE_DOMAIN || 'http://localhost:3000',
      apiBasePath: process.env.SUPERTOKENS_API_BASE_PATH || '/auth',
      websiteBasePath: process.env.SUPERTOKENS_WEBSITE_BASE_PATH || '/auth',
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}