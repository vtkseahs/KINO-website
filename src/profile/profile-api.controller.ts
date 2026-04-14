import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req, Res, UsePipes, ValidationPipe, } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCookieAuth, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse, } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { ProfileService } from './profile.service';
import { UpdateProfileApiDto } from './dto/update-profile-api.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';

@ApiTags('profile')
@ApiCookieAuth('userId')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('api/profile')
export class ProfileApiController {
  constructor(private readonly profileService: ProfileService, private readonly authService: AuthService,) {}

  @Get()
  @ApiOperation({ summary: 'Получить профиль текущего пользователя' })
  @ApiOkResponse({ type: ProfileResponseDto })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  async getProfile(@Req() req: Request) {
    const currUser = await this.authService.requireUser(req);
    return this.profileService.getCurrentProfile(currUser.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Обновить профиль пользователя' })
  @ApiOkResponse({ type: ProfileResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректное тело запроса' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiConflictResponse({ description: 'Пользователь с таким email уже существует' })
  async updateProfile(
    @Req() req: Request,
    @Body() dto: UpdateProfileApiDto) {
    const currUser = await this.authService.requireUser(req);
    return this.profileService.updateCurrentProfile(currUser.id, dto);
  }

  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: 'Удалить профиль пользователя' })
  @ApiNoContentResponse({ description: 'Профиль удален' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  async removeProfile(@Req() req: Request) {
    const currentUser = await this.authService.requireUser(req);
    await this.profileService.removeProfile(currentUser.id);
  }
}
