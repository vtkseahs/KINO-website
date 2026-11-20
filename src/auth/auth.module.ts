import { Global, Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthApiController } from './auth-api.controller';

@Global()
@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [AuthController, AuthApiController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}