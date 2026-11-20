import { BadRequestException } from '@nestjs/common';
import { calendarDate } from '../kino-plus/plus-forms';

export interface MovieMetadata {
  actorNames?: string;
  directorNames?: string;
  franchise?: string;
  releaseDate?: string;
  unusual?: string;
  providerUrls?: string;
}

function labels(value: string | undefined) {
  if (value === undefined) return undefined;
  return [
    ...new Set(
      value
        .split(',')
        .map((name) => name.trim().replace(/\s+/g, ' '))
        .filter(Boolean),
    ),
  ];
}

export function safeWatchLink(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password
      ? url
      : null;
  } catch {
    return null;
  }
}

export function movieMetadata(input: MovieMetadata) {
  const date = input.releaseDate ? calendarDate(input.releaseDate) : null;
  if (input.releaseDate && !date)
    throw new BadRequestException('Укажите корректную дату премьеры');
  const links = input.providerUrls
    ?.split(/\r?\n/)
    .map((link) => link.trim())
    .filter(Boolean);
  if (
    links &&
    (links.length > 8 || links.some((link) => !safeWatchLink(link)))
  ) {
    throw new BadRequestException(
      'Укажите до восьми HTTPS-ссылок на онлайн-кинотеатры',
    );
  }
  return {
    actors: labels(input.actorNames),
    directors: labels(input.directorNames),
    franchise:
      input.franchise === undefined
        ? undefined
        : input.franchise.trim().replace(/\s+/g, ' ') || null,
    premiereOn: input.releaseDate === undefined ? undefined : date,
    unusual: input.unusual === undefined ? undefined : input.unusual === 'true',
    watchLinks: links && [...new Set(links)],
  };
}
