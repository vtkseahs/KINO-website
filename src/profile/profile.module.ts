import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfileApiController } from './profile-api.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ProfileController, ProfileApiController],
  providers: [ProfileService],
})
export class ProfileModule {}