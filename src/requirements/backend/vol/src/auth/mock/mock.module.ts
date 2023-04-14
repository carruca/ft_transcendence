'use strict';
import { Module } from '@nestjs/common';
import { MockService } from './mock.service';

@Module({
  providers: [MockService]
})
export class MockModule {}
