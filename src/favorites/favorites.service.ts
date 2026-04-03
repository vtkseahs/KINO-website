import {ConflictException, Injectable, NotFoundException, } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

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
      where: { id },
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
}