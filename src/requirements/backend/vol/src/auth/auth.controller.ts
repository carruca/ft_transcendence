'use strict'
import { Controller, Get, Res, Req, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @ApiOperation({ description: 'Returns if the user is logged in or not, using signedCookies.auth_method and signedCookies.token' })
  @ApiResponse({ status: 200, description: 'User is logged in' })
  @ApiResponse({ status: 401, description: 'User is not logged in' })
  async getAuth(@Req() req: Request, @Res({passthrough: true}) res: Response): Promise<Object> {
    try {
      const data = await this.authService.getUser(
        req.signedCookies.auth_method,
        req.signedCookies.token,
        req.signedCookies.refresh_token
      );
      if (data) {
        return {
          status: 'OK',
          message: 'User is logged in',
        };
      }
    } catch (error) {
      console.error(error);
    }
    res.clearCookie('token');
    res.clearCookie('refresh_token');
    res.clearCookie('auth_method');
    throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  @ApiOperation({ description: 'Logs the user out by clearing auth cookies' })
  @Get('logout')
  async logout(@Res({passthrough: true}) res: Response): Promise<void> {
    res.clearCookie('token');
    res.clearCookie('refresh_token');
    res.clearCookie('auth_method');
    return ;
  }
}
