import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { MoviesApiController } from './movies-api.controller';
import { MoviesResolver } from './graphql/movies.resolver';
import { CacheModule } from '@nestjs/cache-manager';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, CacheModule.register({
      ttl: 5000,
      max: 100,
    }), StorageModule],
  controllers: [MoviesController, MoviesApiController],
  providers: [MoviesService, MoviesResolver],
  exports: [MoviesService],
})
export class MoviesModule {}