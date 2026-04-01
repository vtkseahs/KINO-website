import { BadRequestException, ConflictException, Injectable, NotFoundException, } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';

const DEMO_USER_ID = 1;

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.favorite.findMany({
      where: { userId: DEMO_USER_ID },
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

  async findOne(id: number) {
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

  async create(createFavoriteDto: CreateFavoriteDto) {
    try {
      return await this.prisma.favorite.create({
        data: {
          userId: DEMO_USER_ID,
          movieId: Number(createFavoriteDto.movieId),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Этот фильм уже есть в избранном');
        }

        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Нельзя добавить в избранное: пользователь или фильм не существует',
          );
        }
      }

      throw error;
    }
  }

  async update(id: number, updateFavoriteDto: UpdateFavoriteDto) {
    await this.findOne(id);

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

        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Нельзя изменить избранное: фильм не существует',
          );
        }
      }

      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.favorite.delete({
      where: { id },
    });
  }
}