import {
  IsIn,
  ValidateIf,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class MovieMetadataFormDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(800)
  actorNames?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(500)
  directorNames?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(120)
  franchise?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Matches(/^(?:\d{4}-\d{2}-\d{2})?$/)
  releaseDate?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsIn(['false', 'true'])
  unusual?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(2500)
  providerUrls?: string;
}
