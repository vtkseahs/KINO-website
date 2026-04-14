import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { MoviesApiController } from './movies-api.controller';
import { MoviesResolver } from './graphql/movies.resolver';

@Module({
  imports: [PrismaModule],
  controllers: [MoviesController, MoviesApiController],
  providers: [MoviesService, MoviesResolver],
  exports: [MoviesService],
})
export class MoviesModule {}