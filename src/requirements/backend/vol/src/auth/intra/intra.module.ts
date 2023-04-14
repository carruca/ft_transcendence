'use strict'
import { Module } from '@nestjs/common';
import { IntraService } from './intra.service';
import { IntraController } from './intra.controller';

@Module({
  providers: [IntraService],
  controllers: [IntraController],
})
export class IntraModule {}
