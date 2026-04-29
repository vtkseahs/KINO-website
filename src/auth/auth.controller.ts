import { Body, Controller, Get, Post, Query, Render, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiExcludeController()
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
  async login(@Req() req: Request, @Body() loginDto: LoginDto, @Res() res: Response) {
    const user = await this.authService.login(
      loginDto.login,
      loginDto.password,
      req,
      res,
    );

    if (!user) {
      return res.redirect('/auth/login?error=1');
    }

    return res.redirect('/');
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    await this.authService.logout(req, res);
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
  async register(@Req() req: Request, @Body() registerDto: RegisterDto, @Res() res: Response,) {
    await this.authService.register(
      registerDto.name,
      registerDto.email,
      registerDto.password,
      req,
      res,
    );

    return res.redirect('/');
  }
}