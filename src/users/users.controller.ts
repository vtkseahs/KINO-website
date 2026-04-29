import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import SuperTokens from 'supertokens-node';
import { UnauthorizedException } from '@nestjs/common';
import { SuperTokensAuthGuard } from '../st-auth/guards/st-auth.guard';
import type { StRequest } from '../st-auth/types/st-request';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('sync')
  @UseGuards(SuperTokensAuthGuard)
  @ApiCookieAuth('sAccessToken')
  @ApiOperation({ summary: 'Связать SuperTokens-пользователя с локальной БД' })
  async sync(@Req() req: StRequest, @Body() body: { name?: string }) {
    const superTokensUserId = req.superTokensUserId;

    if (!superTokensUserId) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    const superTokensUser = await SuperTokens.getUser(superTokensUserId);
    const email = superTokensUser?.emails[0];

    if (!email) {
      throw new UnauthorizedException('Email пользователя не найден');
    }

    return this.usersService.syncSuperTokensUser({
      superTokensUserId,
      email,
      name: body.name,
    });
  }

  @Get('me')
  @UseGuards(SuperTokensAuthGuard)
  @ApiCookieAuth('sAccessToken')
  @ApiOperation({ summary: 'Получить текущего локального пользователя' })
  async me(@Req() req: StRequest) {
    return this.usersService.findBySuperTokensUserId(req.superTokensUserId);
  }
}