import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class MovieMetadataFormDto {
  @IsOptional()
  @IsString()
  @MaxLength(800)
  actorNames?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  directorNames?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  franchise?: string;

  @IsOptional()
  @Matches(/^(?:\d{4}-\d{2}-\d{2})?$/)
  releaseDate?: string;

  @IsOptional()
  @IsIn(['false', 'true'])
  unusual?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2500)
  providerUrls?: string;
}
