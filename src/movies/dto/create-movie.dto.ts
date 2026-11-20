import { IntersectionType } from '@nestjs/mapped-types';
import { CreateMovieApiDto } from './create-movie-api.dto';
import { MovieMetadataFormDto } from './movie-metadata-form.dto';

export class CreateMovieDto extends IntersectionType(CreateMovieApiDto, MovieMetadataFormDto) {}
