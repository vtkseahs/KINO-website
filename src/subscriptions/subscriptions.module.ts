import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsController } from './subscribe.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsApiController } from './subscriptions-api.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionsController, SubscriptionsApiController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}