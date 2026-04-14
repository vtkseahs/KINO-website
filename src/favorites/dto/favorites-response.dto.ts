import { ApiProperty } from '@nestjs/swagger';

class GenreSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'жанр фильма' })
  name: string;
}

class MovieSummaryDto {
  @ApiProperty({ example: 10 })
  id: number;

  @ApiProperty({ example: 'тест' })
  title: string;

  @ApiProperty({ example: 'тестовый фильм' })
  description: string;

  @ApiProperty({ example: 2026 })
  year: number;

  @ApiProperty({ example: 123 })
  duration: number;

  @ApiProperty({ example: '12+' })
  ageRating: string;

  @ApiProperty({ example: 'https://ex.ru/poster.jpg', nullable: true })
  posterUrl: string | null;

  @ApiProperty({ type: GenreSummaryDto })
  genre: GenreSummaryDto;
}

export class FavoritesResponseDto {
  @ApiProperty({ example: 5 })
  id: number;

  @ApiProperty({ type: MovieSummaryDto })
  movie: MovieSummaryDto;
}

export class FavoritesPageResponseDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 4 })
  total: number;

  @ApiProperty({ type: [FavoritesResponseDto] })
  data: FavoritesResponseDto[];
}
