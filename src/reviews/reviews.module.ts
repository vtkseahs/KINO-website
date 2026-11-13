import { Module } from '@nestjs/common';
import { DiscussionsService } from './discussions.service';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ReviewsApiController } from './reviews-api.controller';
import { ReviewsResolver } from './graphql/reviews.resolver';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [ReviewsController, ReviewsApiController],
  providers: [ReviewsService, ReviewsResolver, DiscussionsService],
})
export class ReviewsModule {}