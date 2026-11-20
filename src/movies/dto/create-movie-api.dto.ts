import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMovieApiDto {
  @ApiProperty({ example: 'Тест' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Описание фильма' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(2147483647)
  year: number;

  @ApiProperty({ example: 111 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  duration: number;

  @ApiProperty({ example: '12+' })
  @IsString()
  @IsNotEmpty()
  ageRating: string;

  @ApiPropertyOptional({ example: 'https://ex.ru/poster.jpg', nullable: true, type: String })
  @IsOptional()
  @IsString()
  posterUrl?: string | null;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  genreId: number;
}
