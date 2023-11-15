'use strict'
import { Module } from '@nestjs/common';
import { IntraModule } from './intra/intra.module';
import { AuthService } from './auth.service';
import { IntraService } from './intra/intra.service';
import { MockController } from './mock/mock.controller';
import { MockModule } from './mock/mock.module';

@Module({
  imports: [IntraModule, MockModule],
  providers: [AuthService, IntraService],
  controllers: [MockController],
  exports: [AuthService],
})
export class AuthModule {}
