'use strict';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MockService {

  async login(code: string): Promise<any> {
    try {
      return {
        access_token: code,
        refresh_token: 'mock_refresh_token'
      }
    } catch (error) {
      console.error(error);
    }
  }

  async intraBearer(): Promise<any> {
    const response = await fetch(`${process.env.NEST_INTRA_API_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.NEST_INTRA_UID,
        client_secret: process.env.NEST_INTRA_SECRET,
        grant_type: 'client_credentials',
        scope: 'public',
      }),
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  }

  async getUser(token: string): Promise<any> {
    try {
      const { access_token } = await this.intraBearer();
      const response = await fetch(`${process.env.NEST_INTRA_API_URL}/v2/users/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
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
