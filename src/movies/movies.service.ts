import { pageOffset } from '../pagination/page-offset';
import { movieMetadata } from './movie-metadata';
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Subject } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client.js';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class MoviesService {
  private readonly events$ = new Subject<MessageEvent>();
  private catalogVersion = 0;

  constructor(private readonly prisma: PrismaService,
              @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,) {}

  getEvents() {
    return this.events$.asObservable();
  }

  private sendEvent(message: string) {
    this.catalogVersion += 1;
    this.events$.next({
      data: {
        message,
        time: new Date().toLocaleTimeString('ru-RU'),
      },
    });
  }

  async findCatalog(filters: { query: string; genreId?: number; byTitle: boolean; page: number }) {
    const pageSize = 24;
    const where: Prisma.MovieWhereInput = {
      title: filters.query ? { contains: filters.query, mode: 'insensitive' } : undefined,
      genreId: filters.genreId,
    };
    const rows = await this.prisma.movie.findMany({
      where,
      include: { genre: true },
      orderBy: filters.byTitle ? [{ title: 'asc' }, { id: 'asc' }] : { id: 'asc' },
      skip: (filters.page - 1) * pageSize,
      take: pageSize + 1,
    });
    return { movies: rows.slice(0, pageSize), hasNext: rows.length > pageSize };
  }

  async findHomepageMovies(now: Date) {
    const released = { OR: [{ premiereOn: null }, { premiereOn: { lte: now } }] };
    const include = { genre: true };
    const [featured, recent, premieres] = await Promise.all([
      this.prisma.movie.findMany({ where: released, include, orderBy: { id: 'asc' }, take: 40 }),
      this.prisma.movie.findMany({ include, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 4 }),
      this.prisma.movie.findMany({
        where: { premiereOn: { gt: now } }, include, orderBy: [{ premiereOn: 'asc' }, { id: 'asc' }], take: 4,
      }),
    ]);
    return { featured, recent, premieres };
  }

  async findOne(id: number) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: { genre: true},
    });

    if (!movie) {
      throw new NotFoundException(`Фильм с id=${id} не найден`);
    }
    return movie;
  }

  async findGenres() {
    return this.prisma.genre.findMany({
      orderBy: { name: 'asc', },
    });
  }

  async create(createMovieDto: CreateMovieDto) {
    const movie = await this.prisma.movie.create({
      data: {
        ...movieMetadata(createMovieDto),
        title: createMovieDto.title,
        description: createMovieDto.description,
        year: Number(createMovieDto.year),
        duration: Number(createMovieDto.duration),
        ageRating: createMovieDto.ageRating,
        posterUrl: createMovieDto.posterUrl,
        genreId: Number(createMovieDto.genreId),
      },
      include:{
        genre:true
      }
    });

    this.sendEvent(`Добавлен фильм: ${movie.title}`);
    return movie;
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    await this.findOne(id);

    const movie = await this.prisma.movie.update({
      where: { id },
      data: {
        ...movieMetadata(updateMovieDto),
        title: updateMovieDto.title !==undefined
          ? updateMovieDto.title
          : undefined,
        description: updateMovieDto.description !== undefined
          ? updateMovieDto.description
          : undefined,
        year:
          updateMovieDto.year !== undefined
            ? Number(updateMovieDto.year)
            : undefined,
        duration:
          updateMovieDto.duration !== undefined
            ? Number(updateMovieDto.duration)
            : undefined,
        ageRating: updateMovieDto.ageRating !== undefined ? updateMovieDto.ageRating : undefined,
        posterUrl: updateMovieDto.posterUrl === '' ? undefined : updateMovieDto.posterUrl,
        genreId:
          updateMovieDto.genreId !== undefined
            ? Number(updateMovieDto.genreId)
            : undefined,
      },
      include:{
        genre:true
      }
    });

    this.sendEvent(`Изменен фильм: ${movie.title}`);
    return movie;
  }

  async remove(id: number) {
    const movie = await this.findOne(id);

    await this.prisma.movie.delete({
      where: { id },
    });

    this.sendEvent(`Удален фильм: ${movie.title}`);
  }

  async findAllPaginated(page: number, limit: number) {
    const skip = pageOffset(page, limit);
    const cacheKey = `movies:${this.catalogVersion}:${page}:${limit}`;
    const cached = await this.cacheManager.get<{
      page: number;
      limit: number;
      total: number;
      data: unknown[]; }>(cacheKey);

    if (cached) {
      return cached;
    }
    const [data, total] = await Promise.all([
      this.prisma.movie.findMany({
        include: { genre: true },
        orderBy: { id: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.movie.count(),
    ]);

    const result={ page, limit, total, data };
    await this.cacheManager.set(cacheKey, result, 5000);
    return result;
  }

  async findReviewsByMovie(movieId: number, page: number, limit: number) {
    await this.findOne(movieId);

    const skip = pageOffset(page, limit);

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { movieId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { id: 'desc' }, skip, take: limit,
      }),
      this.prisma.review.count({
        where: { movieId }
      }),
    ]);
    return { page, limit, total, data };
  }
}