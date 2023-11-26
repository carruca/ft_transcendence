'use strict'
import { Injectable } from '@nestjs/common';
import { IntraService } from './intra/intra.service';
import { MockService } from './mock/mock.service';
import { RateLimitedFetchService } from 'src/rate-limited/rate-limited-fetch.service';

@Injectable()
export class AuthService {

  private authMethods: Record<string, any>;

  constructor(private readonly rateLimitedFetchService: RateLimitedFetchService) {
    this.authMethods = {
      'intra': IntraService,
      'mock': process.env.NEST_AUTH_MOCK === 'true' ? MockService : null
    };
  }

  async getUser(authMethod: string, token: string, refresh_token: string): Promise<any> {
    try {
      const data = new this.authMethods[authMethod](this.rateLimitedFetchService).getUser(token, refresh_token);
      return data;
    } catch (error) {
      if (error instanceof TypeError) {
        console.error(`Auth method '${authMethod}' not supported`);
      }
      throw error;
    }
  }
}
