import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MoviesModule } from './movies/movies.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ProfileModule } from './profile/profile.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PrismaModule } from './prisma/prisma.module';
import {SubscribeController} from './subscribe.controller';
@Module({
  imports: [MoviesModule, FavoritesModule, ProfileModule, ReviewsModule,PrismaModule,],
  controllers: [AppController, SubscribeController],
  providers: [AppService],
})
export class AppModule {}