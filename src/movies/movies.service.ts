import { Injectable, NotFoundException } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Subject } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Injectable()
export class MoviesService {
  private readonly events$ = new Subject<MessageEvent>();

  constructor(private readonly prisma: PrismaService) {}

  getEvents() {
    return this.events$.asObservable();
  }

  private sendEvent(message: string) {
    this.events$.next({
      data: {
        message,
        time: new Date().toLocaleTimeString('ru-RU'),
      },
    });
  }

  async findAll() {
    return this.prisma.movie.findMany({
      include: { genre: true},
      orderBy: { id: 'asc' },
    });
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
    const existingMovie = await this.findOne(id);

    const movie = await this.prisma.movie.update({
      where: { id },
      data: {
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
        posterUrl:
          updateMovieDto.posterUrl !== undefined &&
          updateMovieDto.posterUrl !== ''
            ? updateMovieDto.posterUrl
            : existingMovie.posterUrl,
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
    const skip = (page-1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.movie.findMany({
        include: { genre: true },
        orderBy: { id: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.movie.count(),
    ]);

    return { page, limit, total, data };
  }

  async findReviewsByMovie(movieId: number, page: number, limit: number) {
    await this.findOne(movieId);

    const skip = (page-1)*limit;

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { movieId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
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