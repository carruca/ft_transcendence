'use strict';
import { Module } from '@nestjs/common';
import { MockService } from './mock.service';
import { RateLimitedFetchModule } from '../../rate-limited/rate-limited-module';

@Module({
  imports: [RateLimitedFetchModule],
  providers: [MockService],
  exports: [MockService],
})
export class MockModule {}
