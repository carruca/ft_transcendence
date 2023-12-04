import { Injectable } from '@nestjs/common';
import Bottleneck from 'bottleneck';

@Injectable()
export class RateLimitedFetchService {
  private limiter: Bottleneck;

  constructor() {
    this.limiter = new Bottleneck({
      maxConcurrent: 2,
      minTime: 550,
    });
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    return this.limiter.schedule(async () => await fetch(url, options));
  }
}
