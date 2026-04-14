import { Module } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { PrismaModule } from '../prisma/prisma.module';
import {FavoritesApiController} from './favorites-api.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FavoritesController, FavoritesApiController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
