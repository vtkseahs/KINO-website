import { IntersectionType } from '@nestjs/mapped-types';
import { UpdateMovieApiDto } from './update-movie-api.dto';
import { MovieMetadataFormDto } from './movie-metadata-form.dto';

export class UpdateMovieDto extends IntersectionType(UpdateMovieApiDto, MovieMetadataFormDto) {}
