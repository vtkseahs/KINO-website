import { Args, Int, Mutation, Query, Resolver, Context } from '@nestjs/graphql';
import { ProfileService } from '../profile.service';
import { ProfileModel } from './models/profile.model';
import { UpdateProfileInput } from './inputs/update-profile.input';
import { UseGuards } from '@nestjs/common';
import { SuperTokensAuthGuard } from '../../st-auth/guards/st-auth.guard';
import { UsersService } from '../../users/users.service';
import type { StRequest } from '../../st-auth/types/st-request';

@Resolver(() => ProfileModel)
export class ProfileResolver {
  constructor(private readonly profileService: ProfileService, private readonly usersService: UsersService) {}

  @UseGuards(SuperTokensAuthGuard)
  @Query(() => ProfileModel, {
    name: 'profile',
    description: 'Получить профиль пользователя',
  })
  async getProfile(@Context('req') req: StRequest) {
    const user = await this.usersService.findBySuperTokensUserId(
      req.superTokensUserId,
    );

    return this.profileService.getCurrentProfile(user.id);
  }

  @UseGuards(SuperTokensAuthGuard)
  @Mutation(() => ProfileModel, {
    name: 'updateProfile',
    description: 'Обновить профиль пользователя'
  })
  async updateProfile(@Context('req') req: StRequest, @Args('input') input: UpdateProfileInput) {
    const user = await this.usersService.findBySuperTokensUserId(
      req.superTokensUserId,
    );

    return this.profileService.updateCurrentProfile(user.id, input);
  }

  @UseGuards(SuperTokensAuthGuard)
  @Mutation(() => Boolean, {
    name: 'removeProfile',
    description: 'Удалить профиль пользователя',
  })
  async removeProfile(@Context('req') req: StRequest) {
    const user = await this.usersService.findBySuperTokensUserId(
      req.superTokensUserId,
    );

    await this.profileService.removeProfile(user.id);
    return true;
  }

}