'use strict'
import { Injectable } from '@nestjs/common';
import { IntraToken } from './intra.interceptor';
import { RateLimitedFetchService } from '../../rate-limited/rate-limited-fetch.service';

@Injectable()
export class IntraService {
  constructor(private readonly rateLimitedFetchService: RateLimitedFetchService) {}

  async login(code: string): Promise<any> {
    try {
      const response = await this.rateLimitedFetchService.fetch(`${process.env.NEST_INTRA_API_URL}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: `${process.env.NEST_INTRA_UID}`,
          client_secret: `${process.env.NEST_INTRA_SECRET}`,
          code,
          redirect_uri: `${process.env.NEST_INTRA_REDIRECT_URI}`,
        }),
      });
      if (!response.ok) {
        throw response;
      }
      return response.json();
    } catch (error) {
      console.error(error.statusText);
      throw error;
    }
  }

  @IntraToken()
  async getUser(token: string, _refresh_token: string): Promise<any> {
    try {
      const response = await this.rateLimitedFetchService.fetch(`${process.env.NEST_INTRA_API_URL}/v2/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw response;
      }
      return response.json();
    } catch (error) {
      console.error(error.statusText);
      throw error;
    }
  }

  async refreshToken(refresh_token: string): Promise<any> {
    try {
      const response = await this.rateLimitedFetchService.fetch(`${process.env.NEST_INTRA_API_URL}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: `${process.env.NEST_INTRA_UID}`,
          client_secret: `${process.env.NEST_INTRA_SECRET}`,
          refresh_token,
        })
      })
      if (response.ok) {
        return await response.json()
      }
      throw response
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
