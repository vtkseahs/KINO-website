import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req, Res, UsePipes, ValidationPipe, } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCookieAuth, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse, } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileApiDto } from './dto/update-profile-api.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UseGuards } from '@nestjs/common';
import { SuperTokensAuthGuard } from '../st-auth/guards/st-auth.guard';
import type { StRequest } from '../st-auth/types/st-request';
import { UsersService} from '../users/users.service';

@ApiTags('profile')
@ApiCookieAuth('sAccessToken')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('api/profile')
export class ProfileApiController {
  constructor(private readonly profileService: ProfileService, private readonly usersService: UsersService,) {}

  @Get()
  @UseGuards(SuperTokensAuthGuard)
  @ApiOperation({ summary: 'Получить профиль текущего пользователя' })
  @ApiOkResponse({ type: ProfileResponseDto })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  async getProfile(@Req() req: StRequest) {
    const currentUser = await this.usersService.findBySuperTokensUserId(req.superTokensUserId);
    return this.profileService.getCurrentProfile(currentUser.id);
  }

  @Patch()
  @UseGuards(SuperTokensAuthGuard)
  @ApiOperation({ summary: 'Обновить профиль пользователя' })
  @ApiOkResponse({ type: ProfileResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректное тело запроса' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiConflictResponse({ description: 'Пользователь с таким email уже существует' })
  async updateProfile(
    @Req() req: StRequest,
    @Body() dto: UpdateProfileApiDto) {
    const currentUser = await this.usersService.findBySuperTokensUserId(req.superTokensUserId);
    return this.profileService.updateCurrentProfile(currentUser.id, dto);
  }

  @Delete()
  @UseGuards(SuperTokensAuthGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'Удалить профиль пользователя' })
  @ApiNoContentResponse({ description: 'Профиль удален' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  async removeProfile(@Req() req: StRequest) {
    const currentUser = await this.usersService.findBySuperTokensUserId(req.superTokensUserId);
    await this.profileService.removeProfile(currentUser.id);
  }
}
