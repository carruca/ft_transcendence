'use strict'
import { Module } from '@nestjs/common';
import { IntraModule } from './intra/intra.module';
import { AuthService } from './auth.service';
import { IntraService } from './intra/intra.service';

@Module({
  imports: [IntraModule],
  providers: [AuthService, IntraService]
})
export class AuthModule {}
