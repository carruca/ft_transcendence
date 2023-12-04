import { Module } from '@nestjs/common';
import { RateLimitedFetchService } from './rate-limited-fetch.service';

@Module({
  providers: [RateLimitedFetchService],
  exports: [RateLimitedFetchService],
})
export class RateLimitedFetchModule {}
