import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { MoviesService } from '../movies.service';
import { MovieModel } from './models/movie.model';
import { MoviesPageModel } from './models/movies-page.model';
import { CreateMovieInput } from './inputs/create-movie.input';
import { UpdateMovieInput } from './inputs/update-movie.input';
import { MoviesPaginationInput } from './inputs/movies-pagination.input';
import { GenreModel } from './models/genre.model';
import { UseGuards } from '@nestjs/common';
import { Role } from '../../../generated/prisma/client.js';
import { SuperTokensAuthGuard } from '../../st-auth/guards/st-auth.guard';
import { Roles } from '../../st-auth/decorators/roles.decorator';

@Resolver(() => MovieModel)
export class MoviesResolver {
  constructor(private readonly moviesService: MoviesService) {}

  @Query(() => MoviesPageModel, { name: 'movies', description: 'Получить список фильмов' })
  async findAll(@Args('pagination', { nullable: true }) pagination?: MoviesPaginationInput)
  {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;

    return this.moviesService.findAllPaginated(page, limit);
  }

  @Query(() => MovieModel, { name: 'movie', description: 'Получить фильм по id' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.moviesService.findOne(id);
  }

  @UseGuards(SuperTokensAuthGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => MovieModel, { name: 'createMovie', description: 'Создать фильм' })
  async create(
    @Args('input') input: CreateMovieInput) {
    return this.moviesService.create(input);
  }

  @UseGuards(SuperTokensAuthGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => MovieModel, { name: 'updateMovie', description: 'Обновить фильм' })
  async update(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateMovieInput) {
    return this.moviesService.update(id, input);
  }

  @UseGuards(SuperTokensAuthGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => Boolean, { name: 'removeMovie', description: 'Удалить фильм' })
  async remove(
    @Args('id', { type: () => Int }) id: number) {
    await this.moviesService.remove(id);
    return true;
  }

  @ResolveField(() => GenreModel, { name: 'genre', description: 'Жанр фильма' })
  async genre(@Parent() movie: MovieModel) {
    return movie.genre;
  }
}