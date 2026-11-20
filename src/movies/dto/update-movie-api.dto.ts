import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMovieApiDto {
  @ApiPropertyOptional({ example: 'Шарарам' })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({ example: 'История о смешариках' })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({ example: 2020 })
  @ValidateIf((_, value) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(2147483647)
  year?: number;

  @ApiPropertyOptional({ example: 120 })
  @ValidateIf((_, value) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  duration?: number;

  @ApiPropertyOptional({ example: '12+' })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  ageRating?: string;

  @ApiPropertyOptional({ example: 'https://ex.com/img.jpg', nullable: true, type: String })
  @IsOptional()
  @IsString()
  posterUrl?: string | null;

  @ApiPropertyOptional({ example: 1 })
  @ValidateIf((_, value) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  genreId?: number;
}
