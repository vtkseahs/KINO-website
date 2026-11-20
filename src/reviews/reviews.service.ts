import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findDiscussionMovies() {
    return this.prisma.movie.findMany({
      include: { genre: true, _count: { select: { reviews: true, discussionPosts: true } } },
      orderBy: { title: 'asc' },
    });
  }

  async findMovieDiscussion(movieId: number) {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
      include: { genre: true, reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } } },
    });
    if (!movie) throw new NotFoundException('Фильм не найден');
    return movie;
  }

  async findAll() {
    return this.prisma.review.findMany({
      include: {
        user: {
          select: {
            id: true,
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

  private validateReview(rating: unknown, comment: unknown) {
    if (rating !== undefined && (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 10)) throw new BadRequestException('Оценка должна быть целым числом от 1 до 10');
    if (comment !== undefined && (typeof comment !== 'string' || !comment.trim())) throw new BadRequestException('Введите текст отзыва');
  }

  async createForUser(createReviewDto: CreateReviewDto, userId: number) {
    if (createReviewDto.rating == null || createReviewDto.comment == null) throw new BadRequestException('Введите оценку и отзыв');
    this.validateReview(createReviewDto.rating, createReviewDto.comment);
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
    this.validateReview(updateReviewDto.rating, updateReviewDto.comment);
    await this.findOwnedByUser(id, userId);
    try {
      return await this.prisma.review.update({
        where: { id },
        data: {
          rating:
            updateReviewDto.rating !== undefined
              ? Number(updateReviewDto.rating)
              : undefined,
          comment: updateReviewDto.comment !==undefined ? updateReviewDto.comment : undefined,
          movieId:
            updateReviewDto.movieId !== undefined
              ? Number(updateReviewDto.movieId)
              : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
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
