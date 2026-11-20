import { GroupPickService } from './group-pick.service';
import { Module } from '@nestjs/common';
import { KinoPlusController } from './kino-plus.controller';
import { KinoPlusService } from './kino-plus.service';
import { PlusAccessService } from './plus-access.service';

@Module({
  controllers: [KinoPlusController],
  providers: [KinoPlusService, PlusAccessService, GroupPickService],
  exports: [PlusAccessService],
})
export class KinoPlusModule {}
