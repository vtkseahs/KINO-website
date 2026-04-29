import { Module } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { PrismaModule } from '../prisma/prisma.module';
import {FavoritesApiController} from './favorites-api.controller';
import { FavoritesResolver } from './graphql/favorites.resolver';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [FavoritesController, FavoritesApiController],
  providers: [FavoritesService,FavoritesResolver],
})
export class FavoritesModule {}
