import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ReviewsApiController } from './reviews-api.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewsController, ReviewsApiController],
  providers: [ReviewsService],
})
export class ReviewsModule {}