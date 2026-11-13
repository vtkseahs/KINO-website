import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async addMovie(userId: number, movieId: number) {
    return this.prisma.favorite.upsert({ where: { userId_movieId: { userId, movieId } }, create: { userId, movieId }, update: {} });
  }

  async toggleMovie(userId: number, movieId: number) {
    const favorite = await this.prisma.favorite.findUnique({ where: { userId_movieId: { userId, movieId } } });
    if (favorite) return this.prisma.favorite.delete({ where: { id: favorite.id } });
    return this.prisma.favorite.upsert({ where: { userId_movieId: { userId, movieId } }, create: { userId, movieId }, update: {} });
  }

  async findAll(userId: number) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        movie: {
          include: {
            genre: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number, userId?: number) {
    const favorite = await this.prisma.favorite.findUnique({
      where: { id, userId },
      include: {
        movie: {
          include: {
            genre: true,
          },
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException(`Избранное с id=${id} не найдено`);
    }

    return favorite;
  }

  async findMovies() {
    return this.prisma.movie.findMany({
      include: {
        genre: true,
      },
      orderBy: {
        title: 'asc',
      },
    });
  }

  async create(createFavoriteDto: CreateFavoriteDto, userId: number) {
    try {
      return await this.prisma.favorite.create({
        data: {
          userId,
          movieId: Number(createFavoriteDto.movieId),
        },
        include: {
          movie: {
            include: {
              genre: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Этот фильм уже есть в избранном');
        }
      }
      throw error;
    }
  }

  async update(id: number, updateFavoriteDto: UpdateFavoriteDto, userId: number) {
    await this.findOne(id, userId);

    try {
      return await this.prisma.favorite.update({
        where: { id },
        data: {
          movieId: Number(updateFavoriteDto.movieId),
        },
        include: {
          movie: {
            include: {
              genre: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Этот фильм уже есть в избранном');
        }
      }
      throw error;
    }
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);

    return this.prisma.favorite.delete({
      where: { id },
    });
  }

  async findAllPaginated(userId: number, page: number, limit: number) {
    const skip = (page-1)*limit;

    const [data, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        include: {
          movie: {
            include: {
              genre: true,
            },
          },
        },
        orderBy: { id: 'asc' }, skip, take: limit,
      }),
      this.prisma.favorite.count({
        where: { userId }
      }),
    ]);

    return { page, limit, total, data };
  }
}