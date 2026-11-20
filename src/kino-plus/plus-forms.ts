import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { InterestKind, JournalStatus } from '../../generated/prisma/client.js';

export class JournalForm {
  @IsEnum(JournalStatus)
  status: JournalStatus;

  @IsOptional()
  @Matches(/^(?:\d{4}-\d{2}-\d{2})?$/)
  watchedOn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  impression?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  company?: string;
}

export class InterestForm {
  @IsEnum(InterestKind)
  kind: InterestKind;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;
}

export const journalStatuses = [
  { value: JournalStatus.WANT, label: 'Хочу посмотреть' },
  { value: JournalStatus.WATCHING, label: 'Смотрю' },
  { value: JournalStatus.WATCHED, label: 'Посмотрел' },
  { value: JournalStatus.DROPPED, label: 'Бросил' },
  { value: JournalStatus.REWATCH, label: 'Пересмотрю' },
  { value: JournalStatus.DISMISSED, label: 'Не интересует' },
];

export const interestKinds = [
  { value: InterestKind.ACTOR, label: 'Актёр' },
  { value: InterestKind.DIRECTOR, label: 'Режиссёр' },
  { value: InterestKind.FRANCHISE, label: 'Франшиза' },
  { value: InterestKind.GENRE, label: 'Жанр' },
  { value: InterestKind.PREMIERE, label: 'Премьера' },
];

export const day = 86_400_000;
export const dateKey = (date: Date) => date.toISOString().slice(0, 10);

export function calendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && dateKey(date) === value
    ? date
    : null;
}
