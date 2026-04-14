import { Body, Controller, Get, Post, Req, Render, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ProfileService } from './profile.service';
import { AuthService } from '../auth/auth.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService, private readonly authService: AuthService) {}

  @Get()
  async getProfilePage(@Req() req: Request, @Res() res: Response) {
    const auth = await this.authService.getAuthData(req);
    if (!auth || !auth.user) return;

    const profile = await this.profileService.getCurrentProfile(auth.user.id);

    return res.render('profile', {
      ...auth,
      title: 'Профиль Kino',
      profile,
    });
  }

  @Get('edit')
  async getEditProfilePage(@Req() req: Request, @Res() res: Response) {
    const auth = await this.authService.getAuthData(req);
    if (!auth || !auth.user) return;

    const profile = await this.profileService.getCurrentProfile(auth.user.id);

    return res.render('profile-form', {
      ...auth,
      title: 'Редактировать профиль',
      profile,
      formAction: '/profile/edit',
    });
  }

  @Post('edit')
  async updateProfile(
    @Req() req: Request,
    @Body() updateProfileDto: UpdateProfileDto,
    @Res() res: Response,
  ) {
    const currentUser = await this.authService.requireUser(req);
    await this.profileService.updateCurrentProfile(currentUser.id, updateProfileDto);
    return res.redirect('/profile');
  }
}