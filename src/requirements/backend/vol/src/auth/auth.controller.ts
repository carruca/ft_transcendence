'use strict'
import { Controller, Get, Res, Next, Req, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  async getAuth(@Req() req: Request, @Res({passthrough: true}) res: Response): Promise<string> {
    try {
      const data = await this.authService.getUser(req.signedCookies.auth_method, req.signedCookies.token);
      return data.login;
    } catch (error) {
      console.error(error);
    }
    res.clearCookie('token');
    res.clearCookie('refresh_token');
    res.clearCookie('auth_method');
    throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  @Get('logout')
  async logout(@Res({passthrough: true}) res: Response): Promise<void> {
    res.clearCookie('token');
    res.clearCookie('refresh_token');
    res.clearCookie('auth_method');
    return ;
  }
}
