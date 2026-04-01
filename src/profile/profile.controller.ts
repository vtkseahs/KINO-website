import { Body, Controller, Get, Post, Query, Render, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @Render('profile')
  async getProfilePage(@Query('auth') auth?: string) {
    const isAuth = auth === '1';
    const profile = await this.profileService.getCurrentProfile();

    return {
      title: 'Профиль Kino',
      isAuth,
      user: isAuth ? { name: profile.name } : null,
      profile,
    };
  }

  @Get('edit')
  @Render('profile-form')
  async getEditProfilePage(@Query('auth') auth?: string) {
    const isAuth = auth === '1';
    const profile = await this.profileService.getCurrentProfile();

    return {
      title: 'Редактировать профиль',
      isAuth,
      user: isAuth ? { name: profile.name } : null,
      profile,
      formAction: '/profile/edit',
    };
  }

  @Post('edit')
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @Res() res: Response,
  ) {
    await this.profileService.updateCurrentProfile(updateProfileDto);
    return res.redirect('/profile?auth=1');
  }
}