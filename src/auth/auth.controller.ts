import { Body, Controller, Get, Post, Query, Render, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @Render('login')
  async getLoginPage(
    @Req() req: Request,
    @Query('error') error?: string,
  ) {
    const auth = await this.authService.getAuthData(req);

    return {
      title: 'Вход в Kino',
      ...auth,
      errorMessage: error === '1' ? 'Неверный логин или пароль' : null,
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const user = await this.authService.login(
      loginDto.login,
      loginDto.password,
    );

    if (!user) {
      return res.redirect('/auth/login?error=1');
    }

    this.authService.setUserCookie(res, user.id);
    return res.redirect('/');
  }

  @Post('logout')
  logout(@Res() res: Response) {
    this.authService.clearUserCookie(res);
    return res.redirect('/');
  }

  @Get('register')
  @Render('register')
  async getRegisterPage(@Req() req: Request, @Query('error') error?: string) {
    const auth = await this.authService.getAuthData(req);

    return {
      title: 'Регистрация в Kino',
      ...auth,
      errorMessage: error === '1' ? 'Пользователь с таким email уже существует' : null,
    };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
    const user = await this.authService.register(
      registerDto.name,
      registerDto.email,
      registerDto.password,
    );

    this.authService.setUserCookie(res, user.id);
    return res.redirect('/');
  }
}