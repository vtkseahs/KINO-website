import { Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException, UsePipes, ValidationPipe, } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCookieAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse, } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginApiDto } from './dto/login-api.dto';
import { RegisterApiDto } from './dto/register-api.dto';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';

@ApiTags('auth')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('api/auth')
export class AuthApiController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Войти в аккаунт' })
  @ApiOkResponse({ type: AuthUserResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный запрос' })
  @ApiUnauthorizedResponse({ description: 'Неверный логин или пароль' })
  async login(
    @Req() req: Request,
    @Body() dto: LoginApiDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.login(dto.login, dto.password, req, res);

    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    return user;
  }

  @Post('register')
  @ApiOperation({ summary: 'Зарегистрировать нового пользователя' })
  @ApiCreatedResponse({ type: AuthUserResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный запрос' })
  @ApiConflictResponse({
    description: 'Пользователь с такой почтой уже существует',
  })
  async register(
    @Req() req: Request,
    @Body() dto: RegisterApiDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(dto.name, dto.email, dto.password, req, res);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiCookieAuth('sAccessToken')
  @ApiOperation({ summary: 'Выйти из аккаунта' })
  @ApiNoContentResponse({ description: 'Выход выполнен' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req, res);
  }

  @Get('me')
  @ApiCookieAuth('sAccessToken')
  @ApiOperation({ summary: 'Получить текущего пользователя' })
  @ApiOkResponse({ type: AuthUserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  async me(@Req() req: Request) {
    return this.authService.requireUser(req);
  }
}