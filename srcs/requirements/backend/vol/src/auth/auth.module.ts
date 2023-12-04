'use strict'
import { Module } from '@nestjs/common';
import { IntraModule } from './intra/intra.module';
import { AuthService } from './auth.service';
import { IntraService } from './intra/intra.service';
import { MockController } from './mock/mock.controller';
import { MockModule } from './mock/mock.module';
import { RateLimitedFetchModule } from '../rate-limited/rate-limited-module';

@Module({
  imports: [IntraModule, MockModule, RateLimitedFetchModule],
  providers: [AuthService, IntraService],
  controllers: [MockController],
  exports: [AuthService],
})
export class AuthModule {}
