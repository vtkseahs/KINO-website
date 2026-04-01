export class MovieEntity {
  id: number;
  title: string;
  description: string;
  year: number;
  duration: number;
  ageRating: string;
  posterUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  genreId: number;
}