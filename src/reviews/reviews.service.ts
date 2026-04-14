import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ConflictException, ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.review.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        movie: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { id: 'desc'},
    });
  }

  async findOne(id: number) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        movie: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Отзыв с id=${id} не найден`);
    }

    return review;
  }

  async findMovies() {
    return this.prisma.movie.findMany({
      orderBy: {
        title: 'asc',
      },
    });
  }

  async createForUser(createReviewDto: CreateReviewDto, userId: number) {
    try {
      return await this.prisma.review.create({
        data: {
          rating: Number(createReviewDto.rating),
          comment: createReviewDto.comment,
          userId: userId,
          movieId: Number(createReviewDto.movieId),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          movie: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Отзыв на этот фильм уже существует');
      }
      throw error;
    }
  }

  async update(id: number, updateReviewDto: UpdateReviewDto, userId: number) {
    await this.findOwnedByUser(id, userId);
    try {
      return await this.prisma.review.update({
        where: { id },
        data: {
          rating:
            updateReviewDto.rating !== undefined
              ? Number(updateReviewDto.rating)
              : undefined,
          comment: updateReviewDto.comment,
          movieId:
            updateReviewDto.movieId !== undefined
              ? Number(updateReviewDto.movieId)
              : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          movie: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Отзыв на этот фильм уже существует');
      }
      throw error;
    }
  }

  async remove(id: number, userId: number) {
    await this.findOwnedByUser(id, userId);

    return this.prisma.review.delete({
      where: { id },
    });
  }

  private async findOwnedByUser(id: number, userId: number) {
    const review = await this.findOne(id);

    if (review.userId !== userId) {
      throw new ForbiddenException('Нельзя изменять чужой отзыв');
    }
    return review;
  }

  async findAllPaginated(page: number, limit: number) {
    const skip = (page-1)*limit;

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          movie: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { id: 'desc' }, skip, take: limit,
      }),
      this.prisma.review.count(),
    ]);
    return { page, limit, total, data };
  }
}
