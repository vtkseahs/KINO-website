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
      include: {
        genre: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: {
        genre: true,
      },
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
        posterUrl: createMovieDto.posterUrl || null,
        genreId: Number(createMovieDto.genreId),
      },
    });

    this.sendEvent(`Добавлен фильм: ${movie.title}`);
    return movie;
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    await this.findOne(id);

    const movie = await this.prisma.movie.update({
      where: { id },
      data: {
        title: updateMovieDto.title,
        description: updateMovieDto.description,
        year:
          updateMovieDto.year !== undefined
            ? Number(updateMovieDto.year)
            : undefined,
        duration:
          updateMovieDto.duration !== undefined
            ? Number(updateMovieDto.duration)
            : undefined,
        ageRating: updateMovieDto.ageRating,
        posterUrl: updateMovieDto.posterUrl || null,
        genreId:
          updateMovieDto.genreId !== undefined
            ? Number(updateMovieDto.genreId)
            : undefined,
      },
    });

    this.sendEvent(`Изменён фильм: ${movie.title}`);
    return movie;
  }

  async remove(id: number) {
    const movie = await this.findOne(id);

    await this.prisma.movie.delete({
      where: { id },
    });

    this.sendEvent(`Удалён фильм: ${movie.title}`);
  }
}