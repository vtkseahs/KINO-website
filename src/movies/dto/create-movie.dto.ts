export class CreateMovieDto {
  title: string;
  description: string;
  year: number;
  duration: number;
  ageRating: string;
  posterUrl?: string;
  genreId: number;
}