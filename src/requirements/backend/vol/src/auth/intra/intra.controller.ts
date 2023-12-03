'use strict'
import { Controller, Get, Res, Query, HttpException, HttpStatus, Req, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { IntraService } from './intra.service';
import { MockCallbackInterceptor } from '../mock/mock.interceptor';

@ApiTags('auth')
@Controller()
export class IntraController {
  constructor(private readonly intraService: IntraService) {}

  @ApiOperation({ description: 'Sends a request to the intra after requesting user permission to access its data, setting cookies if everything went ok, otherwise, unsets these cookies' })
  @ApiResponse({ status: 200, description: 'Permission granted, cookies set' })
  @ApiResponse({ status: 401, description: 'Permission denied or an error occurred, cookies unset' })
  @ApiParam({ name: 'code', description: 'The code returned by the intra after requesting user permission to access its data' })
  @ApiParam({ name: 'mock', description: 'If set to true, will use the mock service instead of the intra service, if env NEST_AUTH_MOCK=true', required: false, type: 'boolean' })
  @Get('callback')
  @UseInterceptors(MockCallbackInterceptor)
  async ftCallback(@Query('code') code: string, @Res({passthrough: true}) res: Response, @Req() req: Request): Promise<string> {
    try {
      const { secure } = req;
      const data = await this.intraService.login(code);
      res.cookie('token', data.access_token, { httpOnly: false, signed: true, sameSite: secure ? 'none' : 'lax', maxAge: 3600000, secure });
      res.cookie('refresh_token', data.refresh_token, { httpOnly: false, signed: true, sameSite: secure ? 'none' : 'lax', maxAge: 3600000 * 2, secure });
      res.cookie('auth_method', 'intra', { httpOnly: false, signed: true, sameSite: secure ? 'none' : 'lax', maxAge: 3600000 * 2, secure });
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
