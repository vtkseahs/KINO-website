import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

const DEMO_USER_ID = 1;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.review.findMany({
      include: {
        user: true,
        movie: true,
      },
      orderBy: {
        id: 'desc',
      },
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

  async create(createReviewDto: CreateReviewDto) {
    return this.prisma.review.create({
      data: {
        rating: Number(createReviewDto.rating),
        comment: createReviewDto.comment,
        userId: DEMO_USER_ID,
        movieId: Number(createReviewDto.movieId),
      },
    });
  }

  async update(id: number, updateReviewDto: UpdateReviewDto) {
    await this.findOne(id);

    return this.prisma.review.update({
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
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.review.delete({
      where: { id },
    });
  }
}