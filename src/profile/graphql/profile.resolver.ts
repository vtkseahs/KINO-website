import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ProfileService } from '../profile.service';
import { ProfileModel } from './models/profile.model';
import { UpdateProfileInput } from './inputs/update-profile.input';

@Resolver(() => ProfileModel)
export class ProfileResolver {
  constructor(private readonly profileService: ProfileService) {}

  @Query(() => ProfileModel, {
    name: 'profile',
    description: 'Получить профиль пользователя',
  })
  async getProfile(
    @Args('userId', { type: () => Int }) userId: number) {
    return this.profileService.getCurrentProfile(userId);
  }

  @Mutation(() => ProfileModel, {
    name: 'updateProfile',
    description: 'Обновить профиль пользователя'
  })
  async updateProfile(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('input') input: UpdateProfileInput) {
    return this.profileService.updateCurrentProfile(userId, input);
  }

  @Mutation(() => Boolean, {
    name: 'removeProfile',
    description: 'Удалить профиль пользователя',
  })
  async removeProfile(
    @Args('userId', { type: () => Int }) userId: number,
  ) {
    await this.profileService.removeProfile(userId);
    return true;
  }

}