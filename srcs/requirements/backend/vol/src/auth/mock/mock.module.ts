'use strict';
import { Module } from '@nestjs/common';
import { MockService } from './mock.service';
import { RateLimitedFetchModule } from '../../rate-limited/rate-limited-module';
import { ExceptionInterceptor } from '../../exception.interceptor';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [RateLimitedFetchModule],
  providers: [
    MockService,
    {
      provide: APP_FILTER,
      useClass: ExceptionInterceptor,
    }
  ],
  exports: [MockService],
})
export class MockModule {}
