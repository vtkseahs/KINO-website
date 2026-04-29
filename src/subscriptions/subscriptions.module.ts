import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsController } from './subscribe.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsApiController } from './subscriptions-api.controller';
import { SubscriptionsResolver } from './graphql/subscriptions.resolver';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [SubscriptionsController, SubscriptionsApiController],
  providers: [SubscriptionsService,SubscriptionsResolver],
})
export class SubscriptionsModule {}