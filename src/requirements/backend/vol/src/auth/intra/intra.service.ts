'use strict'
import { Injectable } from '@nestjs/common';

@Injectable()
export class IntraService {

  async login(code: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEST_INTRA_API_URL}/oauth/token`, {
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
        throw new Error(response.statusText);
      }
      return response.json();
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  async getUser(token: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEST_INTRA_API_URL}/v2/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }
}
