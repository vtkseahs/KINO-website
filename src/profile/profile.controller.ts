import { Body, Controller, ForbiddenException, Get, Post, Req, Render, Res, Param, ParseIntPipe } from '@nestjs/common';
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
    if (!auth.user) return res.redirect('/auth/login');

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
    if (!auth.user) return res.redirect('/auth/login');

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

  @Post(':id/delete')
  async deleteProfile(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const currentUser = await this.authService.requireUser(req);
    if (id !== currentUser.id) throw new ForbiddenException('Можно удалить только свой аккаунт');
    await this.profileService.removeProfile(currentUser.id);
    await this.authService.logout(req, res);
    return res.redirect('/');
  }
}
