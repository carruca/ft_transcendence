'use strict';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MockService {

  async login(_code: string): Promise<any> {
    try {
      // TODO: Implement mock login
      /**
       * Callable by /auth/callback?mock=true&code=..., called by a decorator
       * This receives a 42 intra user's id and returns a mock
       * token as if it was the legit user's token
       */
      return {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token'
      }
    } catch (error) {
      console.error(error);
    }
  }

  async getUser(_token: string): Promise<any> {
    try {
      // TODO: Implement mock getUser
      /**
       * This should return the user's data that is being mocked
       */
      return 'mock_user'
    } catch (error) {
      console.error(error);
    }
  }
}
