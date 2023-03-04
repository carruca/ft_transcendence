'use strict'
import { Controller, Get, Res, Next, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { IntraService } from './intra.service';

@ApiTags('auth')
@Controller()
export class IntraController {
  constructor(private readonly intraService: IntraService) {}

  @Get('callback')
  async ftCallback(@Query('code') code: string, @Res({passthrough: true}) res: Response): Promise<string> {
    try {
      console.log({code})
      const data = await this.intraService.login(code);
      // TODO: lax on cookies? -> Nope!
      res.cookie('token', data.access_token, { httpOnly: false, signed: true, sameSite: 'lax', maxAge: 3600000, secure: false });
      res.cookie('refresh_token', data.refresh_token, { httpOnly: false, signed: true, sameSite: 'lax', maxAge: 3600000, secure: false });
      res.cookie('auth_method', 'intra', { httpOnly: false, signed: true, sameSite: 'lax', maxAge: 3600000, secure: false });
      return data
    } catch (error) {
      console.error(error);
    }
    res.clearCookie('token');
    res.clearCookie('refresh_token');
    res.clearCookie('auth_method');
    throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
  }
}
