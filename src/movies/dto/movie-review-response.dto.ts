import { ApiProperty } from '@nestjs/swagger';

class ReviewUserDto {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({ example: 'test@test.com' })
  email: string;

  @ApiProperty({ example: 'Vika' })
  name: string;
}

export class MovieReviewResponseDto {
  @ApiProperty({ example: 5 })
  id: number;

  @ApiProperty({ example: 9 })
  rating: number;

  @ApiProperty({ example: 'очень понравился фильм' })
  comment: string;

  @ApiProperty({ type: ReviewUserDto })
  user: ReviewUserDto;
}

export class MovieReviewsPageResponseDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ type: [MovieReviewResponseDto] })
  data: MovieReviewResponseDto[];
}
