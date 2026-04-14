import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ReviewsApiController } from './reviews-api.controller';
import { ReviewsResolver } from './graphql/reviews.resolver';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewsController, ReviewsApiController],
  providers: [ReviewsService, ReviewsResolver],
})
export class ReviewsModule {}