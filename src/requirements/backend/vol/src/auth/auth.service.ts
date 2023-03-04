'use strict'
import { Injectable } from '@nestjs/common';
import { IntraService } from './intra/intra.service';

@Injectable()
export class AuthService {

  private authMethods: Record<string, any>;

  constructor() {
    this.authMethods = {
      'intra': IntraService
    };
    console.log({ authMethods: this.authMethods });
  }

  async getUser(authMethod: string, token: string): Promise<any> {
    try {
      const auth = new this.authMethods[authMethod]();
      const data = await auth.getUser(token);
      return data;
    } catch (error) {
      if (error instanceof TypeError) {
        console.error(`Auth method '${authMethod}' not supported`);
      }
      throw error;
    }
  }
}
