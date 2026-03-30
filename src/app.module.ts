import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MovieController } from './movie.controller';
import { FavoritesController } from './favorites.controller';
import {ProfileController} from './profile.controller';
import { SeriesController } from './series.controller';
import {SubscribeController} from './subscribe.controller';
import {ReviewController} from './review.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController, MovieController, FavoritesController, SeriesController, ProfileController, SubscribeController, ReviewController],
  providers: [AppService],
})
export class AppModule {}
