'use strict'
import { Module } from '@nestjs/common';
import { IntraService } from './intra.service';
import { IntraController } from './intra.controller';
import { RateLimitedFetchModule } from '../../rate-limited/rate-limited-module';
import { MockModule } from '../mock/mock.module';

@Module({
  imports: [RateLimitedFetchModule, MockModule],
  providers: [IntraService],
  controllers: [IntraController],
})
export class IntraModule { }
