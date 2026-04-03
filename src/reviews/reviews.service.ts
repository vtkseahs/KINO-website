import { ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.review.findMany({
      include: {
        user: true,
        movie: true,
      },
      orderBy: { id: 'desc'},
    });
  }

  async findOne(id: number) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: true,
        movie: true,
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
    const review= await this.prisma.review.create({
      data: {
        rating: Number(createReviewDto.rating),
        comment: createReviewDto.comment,
        userId: userId,
        movieId: Number(createReviewDto.movieId),
      },
    });
    return review;
  }

  async update(id: number, updateReviewDto: UpdateReviewDto, userId: number) {
    await this.findOwnedByUser(id, userId);
    const review = await this.prisma.review.update({
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
    });
    return review;
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
}
