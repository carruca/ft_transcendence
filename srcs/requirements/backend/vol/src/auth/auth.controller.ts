'use strict'
import { Controller, Get, Res, Req, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * @deprecated Soon a method /auth/me will be added to the backend, which will return the user data
   */
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
  async logout(@Res({ passthrough: true }) res: Response): Promise<void> {
    res.clearCookie('token');
    res.clearCookie('refresh_token');
    res.clearCookie('auth_method');
    res.clearCookie('_2fa');
    return;
  }

  @ApiOperation({ description: 'Get 2FA qr' })
  @Get('2fa/qr')
  async get2FASecret(): Promise<Object> {
    const secret = speakeasy.generateSecret({
      issuer: 'Transcendence',
      name: 'Transcendence',
    });
    const data = await qrcode.toDataURL(secret.otpauth_url || '');
    if (!data) {
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return {
      secret: secret.base32,
      qr: data,
    };
  }
}
