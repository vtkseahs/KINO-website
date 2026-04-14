import { ApiProperty } from '@nestjs/swagger';

class ReviewUserDto {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({ example: 'vika@gmail.com' })
  email: string;

  @ApiProperty({ example: 'Vika' })
  name: string;
}

class ReviewMovieDto {
  @ApiProperty({ example: 10 })
  id: number;

  @ApiProperty({ example: 'Тест' })
  title: string;
}

export class ReviewResponseDto {
  @ApiProperty({ example: 5 })
  id: number;

  @ApiProperty({ example: 9 })
  rating: number;

  @ApiProperty({ example: 'Очень понравился фильм' })
  comment: string;

  @ApiProperty({ type: ReviewUserDto })
  user: ReviewUserDto;

  @ApiProperty({ type: ReviewMovieDto })
  movie: ReviewMovieDto;
}

export class ReviewsPageResponseDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ type: [ReviewResponseDto] })
  data: ReviewResponseDto[];
}
