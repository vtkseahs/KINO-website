import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FavoritesService } from '../favorites.service';
import { FavoriteModel } from './models/favorite.model';
import { FavoritesPageModel } from './models/favorites-page.model';
import { CreateFavoriteInput } from './inputs/create-favorite.input';
import { UpdateFavoriteInput } from './inputs/update-favorite.input';
import { FavoritesPaginationInput } from './inputs/favorites-pagination.input';
import { UseGuards } from '@nestjs/common';
import { SuperTokensAuthGuard } from '../../st-auth/guards/st-auth.guard';
import { UsersService } from '../../users/users.service';
import type { StRequest } from '../../st-auth/types/st-request';

@Resolver(() => FavoriteModel)
export class FavoritesResolver {
  constructor(private readonly favoritesService: FavoritesService, private readonly usersService: UsersService) {}

  @UseGuards(SuperTokensAuthGuard)
  @Query(() => FavoritesPageModel, {
    name: 'get_all_favorites',
    description: 'Получить избранное пользователя',
  })
  async findAll(@Context('req') req: StRequest, @Args('pagination', { nullable: true }) pagination?: FavoritesPaginationInput) {
    const user = await this.usersService.findBySuperTokensUserId(
      req.superTokensUserId,
    );

    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;

    return this.favoritesService.findAllPaginated(user.id, page, limit);
  }

  @UseGuards(SuperTokensAuthGuard)
  @Query(() => FavoriteModel, {
    name: 'get_one_favorites',
    description: 'Получить запись избранного по id',
  })
  async findOne(@Context('req') req: StRequest, @Args('id', { type: () => Int }) id: number) {
    const user = await this.usersService.findBySuperTokensUserId(
      req.superTokensUserId,
    );

    return this.favoritesService.findOne(id, user.id);
  }

  @UseGuards(SuperTokensAuthGuard)
  @Mutation(() => FavoriteModel, {
    name: 'createFavorite',
    description: 'Добавить фильм в избранное',
  })
  async create(@Context('req') req: StRequest, @Args('input') input: CreateFavoriteInput) {
    const user = await this.usersService.findBySuperTokensUserId(
      req.superTokensUserId,
    );

    return this.favoritesService.create(input, user.id);
  }

  @UseGuards(SuperTokensAuthGuard)
  @Mutation(() => FavoriteModel, {
    name: 'updateFavorite',
    description: 'Обновить запись избранного',
  })
  async update(@Context('req') req: StRequest, @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateFavoriteInput) {
    const user = await this.usersService.findBySuperTokensUserId(
      req.superTokensUserId,
    );

    return this.favoritesService.update(id, input, user.id);
  }

  @UseGuards(SuperTokensAuthGuard)
  @Mutation(() => Boolean, {
    name: 'removeFavorite',
    description: 'Удалить запись избранного',
  })
  async remove(@Context('req') req: StRequest, @Args('id', { type: () => Int }) id: number) {
    const user = await this.usersService.findBySuperTokensUserId(
      req.superTokensUserId,
    );

    await this.favoritesService.remove(id, user.id);
    return true;
  }
}