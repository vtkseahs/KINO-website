import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { GroupPickService } from './group-pick.service';
import { KinoPlusService } from './kino-plus.service';
import { PlusAccessService } from './plus-access.service';
import { calendarDate, dateKey, InterestForm, JournalForm } from './plus-forms';

function readFilters(query: Request['query']) {
  const pick = query.pick === '1';
  const value = (key: string) =>
    typeof query[key] === 'string' ? query[key] : '';
  const pickValue = (key: string, options: string[]) =>
    options.includes(value(key)) ? value(key) : '';
  const days = Number(pickValue('period', ['7', '30', '90', '365'])) || 30;
  const requestedMonth = value('month');
  const currentMonth = dateKey(new Date()).slice(0, 7);
  const month =
    calendarDate(requestedMonth + '-01') &&
    requestedMonth >= '1888-01' &&
    requestedMonth <= currentMonth
      ? requestedMonth
      : currentMonth;
  const mood = value('mood');
  const runtime = value('runtime');
  const tone = pickValue('tone', ['light', 'serious']);
  const audience = pickValue('audience', ['group', 'family']);
  const discovery = pickValue('discovery', ['familiar', 'adventurous']);
  const excluded = value('excluded')
    ? [value('excluded')]
    : Array.isArray(query.excluded)
      ? query.excluded
      : [];
  const excludedIds = excluded
    .slice(0, 50)
    .map(Number)
    .filter((id) => Number.isSafeInteger(id) && id > 0);
  return {
    pick,
    days,
    mood,
    runtime,
    month,
    yearly: value('report') === 'year',
    options: { tone, audience, discovery, excluded: excludedIds },
  };
}

@ApiExcludeController()
@Controller('subscribe')
export class KinoPlusController {
  constructor(
    private readonly auth: AuthService,
    private readonly access: PlusAccessService,
    private readonly plus: KinoPlusService,
    private readonly groups: GroupPickService,
  ) {}

  @Get()
  async page(@Req() req: Request, @Res() res: Response) {
    res.set('Cache-Control', 'private, no-store');
    const auth = await this.auth.getAuthData(req);
    const base = {
      ...auth,
      title: 'КИНО Plus',
      failed: req.query.result === 'failed',
    };
    if (!auth.user || !(await this.access.isActive(auth.user.id)))
      return res.render('subscribe', base);

    const filters = readFilters(req.query);
    const seen =
      typeof req.query.seen === 'string' ? req.query.seen.slice(0, 500) : '';
    const dashboard = await this.plus.dashboard(auth.user.id, {
      ...filters,
      options: {
        ...filters.options,
        seenTitles: seen
          .split('\n')
          .map((title) => title.trim())
          .filter(Boolean),
      },
    });
    return res.render('subscribe', {
      ...base,
      ...dashboard,
      active: true,
      activated: req.query.result === 'success',
      period: filters.days,
      month: filters.month,
      yearly: filters.yearly,
      ...filters.options,
      seen,
      canShare: Boolean(
        filters.options.audience && dashboard.moodResults.length > 1,
      ),
    });
  }

  @Post('activate')
  async activate(
    @Req() req: Request,
    @Res() res: Response,
    @Body('result') result: string,
  ) {
    const user = await this.auth.requireUser(req);
    const outcome = result === 'success' ? 'SUCCESS' : 'FAILED';
    await this.access.activate(user.id, outcome);
    return res.redirect(303, '/subscribe?result=' + outcome.toLowerCase());
  }

  @Post('cancel')
  async cancel(@Req() req: Request, @Res() res: Response) {
    const user = await this.auth.requireUser(req);
    await this.access.deactivate(user.id);
    return res.redirect(303, '/subscribe');
  }

  @Post('groups')
  async createGroup(
    @Req() req: Request,
    @Res() res: Response,
    @Body('movies') movies: unknown,
  ) {
    const userId = await this.activeUserId(req);
    const ids = Array.isArray(movies) ? [...new Set(movies.map(Number))] : [];
    if (
      ids.length < 2 ||
      ids.length > 3 ||
      ids.some((id) => !Number.isSafeInteger(id) || id <= 0)
    ) {
      throw new BadRequestException('Для голосования нужны два или три фильма');
    }
    const group = await this.groups.create(userId, ids);
    return res.redirect(303, `/subscribe/groups/${group.id}`);
  }

  @Get('groups/:id')
  async groupPage(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    res.set('Cache-Control', 'private, no-store');
    res.set('X-Robots-Tag', 'noindex');
    const auth = await this.auth.getAuthData(req);
    const group = await this.groups.get(id, auth.user?.id);
    return res.render('plus-group', {
      ...auth,
      ...group,
      groupId: id,
      title: 'Что посмотрим вместе?',
    });
  }

  @Post('groups/:id')
  async groupVote(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('movieId', ParseIntPipe) movieId: number,
  ) {
    const user = await this.auth.requireUser(req);
    await this.groups.vote(id, user.id, movieId);
    return res.redirect(303, `/subscribe/groups/${id}`);
  }

  @Post('journal/:id')
  async saveJournal(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() form: JournalForm,
  ) {
    await this.plus.saveJournal(await this.activeUserId(req), id, form);
    return res.redirect(303, `/movies/${id}#journal-entry`);
  }

  @Post('journal/:id/delete')
  async deleteJournal(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.plus.deleteJournal(await this.activeUserId(req), id);
    return res.redirect(303, '/subscribe#journal');
  }

  @Post('interests')
  async follow(
    @Req() req: Request,
    @Res() res: Response,
    @Body() form: InterestForm,
  ) {
    await this.plus.follow(await this.activeUserId(req), form);
    return res.redirect(303, '/subscribe#interests');
  }

  @Post('interests/:id/delete')
  async unfollow(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.plus.unfollow(await this.activeUserId(req), id);
    return res.redirect(303, '/subscribe#interests');
  }

  @Post('notifications/read')
  async readNotifications(@Req() req: Request, @Res() res: Response) {
    await this.plus.markSeen(await this.activeUserId(req));
    return res.redirect(303, '/subscribe#interests');
  }

  private async activeUserId(req: Request) {
    const user = await this.auth.requireUser(req);
    await this.access.requireActive(user.id);
    return user.id;
  }
}
