import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FavoritesService } from '../favorites.service';
import { FavoriteModel } from './models/favorite.model';
import { FavoritesPageModel } from './models/favorites-page.model';
import { CreateFavoriteInput } from './inputs/create-favorite.input';
import { UpdateFavoriteInput } from './inputs/update-favorite.input';
import { FavoritesPaginationInput } from './inputs/favorites-pagination.input';

@Resolver(() => FavoriteModel)
export class FavoritesResolver {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Query(() => FavoritesPageModel, {
    name: 'get_all_favorites',
    description: 'Получить избранное пользователя',
  })
  async findAll(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('pagination', { nullable: true }) pagination?: FavoritesPaginationInput) {

    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;

    return this.favoritesService.findAllPaginated(userId, page, limit);
  }

  @Query(() => FavoriteModel, {
    name: 'get_one_favorites',
    description: 'Получить запись избранного по id',
  })
  async findOne(
    @Args('id', { type: () => Int }) id: number,
    @Args('userId', { type: () => Int }) userId: number) {
    return this.favoritesService.findOne(id, userId);
  }

  @Mutation(() => FavoriteModel, {
    name: 'createFavorite',
    description: 'Добавить фильм в избранное',
  })
  async create(
    @Args('input') input: CreateFavoriteInput) {
    return this.favoritesService.create(input, input.userId);
  }

  @Mutation(() => FavoriteModel, {
    name: 'updateFavorite',
    description: 'Обновить запись избранного',
  })
  async update(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateFavoriteInput,
  ) {
    return this.favoritesService.update(id, input, input.userId);
  }

  @Mutation(() => Boolean, {
    name: 'removeFavorite',
    description: 'Удалить запись избранного',
  })
  async remove(
    @Args('id', { type: () => Int }) id: number,
    @Args('userId', { type: () => Int }) userId: number,
  ) {
    await this.favoritesService.remove(id, userId);
    return true;
  }
}