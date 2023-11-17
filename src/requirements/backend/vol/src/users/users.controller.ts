import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Req,
  HttpStatus,
  HttpException,
  Res,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Request, Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { FriendStatus } from '../friends/entities/friend.entity';
import { JwtService } from '@nestjs/jwt';
import * as speakeasy from 'speakeasy';

const THREE_DAYS = 1000 * 60 * 60 * 24 * 3;

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService,
    private readonly jwtService: JwtService) { }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put()
  update(@Body() updateUserDto: UpdateUserDto) {
  }
  //TODO:
  /*
  *    Put() updateUser
  *    Interceptor checkUSer is in database
  */

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  findMe(@Req() req: Request) {
    return this.usersService.findOne(req.user?.id);
  }

  @Put('me')
  @UseInterceptors(FileInterceptor('avatar'))
  updateMe(@Req() req: Request, @Body() body?: UpdateUserDto, @UploadedFile() avatar?: Express.Multer.File) {
    return this.usersService.update(req.user?.id, body, avatar);
  }

  @Get('me/achievements')
  findMyAchievements(@Req() req: Request) {
    return this.usersService.findAchievementsUser(req.user?.id);
  }

  @Get('me/friends')
  findMyFriends(@Req() req: Request) {
    return this.usersService.findFriendsUser(req.user?.id);
  }

  @Get('me/pending-friends')
  findMyPendingFriends(@Req() req: Request) {
    return this.usersService.findFriendsUser(req.user?.id, FriendStatus.requested);
  }

  @Get(':id/achievements')
  findAchievementsUser(@Param('id') id: string) {
    return this.usersService.findAchievementsUser(id);
  }

  @Get(':id/friends')
  findFriendsUser(@Param('id') id: string) {
    return this.usersService.findFriendsUser(id);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.usersService.getLeaderboard();
  }

  /*  @Get(':id')
    findOne(@Param('id') id: number) {
      return this.usersService.findOne(id);
    }
  */
  @Get(':nickname')
  findOneByNickname(@Param('nickname') nickname: string) {
    return this.usersService.findOneByNickname(nickname);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  private verifyAndSet2FA (secret: string, code: string): void {
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
    });

    if (!verified) {
      throw new HttpException('Invalid code', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('me/2fa')
  async enable2FA(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body('secret') secret: string | undefined, @Body('code') code: string) {
    const userId = req.user?.id;
    
    const storedSecret = await this.usersService.get2FASecret(userId);
    if (secret && !storedSecret) {
      this.verifyAndSet2FA(secret, code);
      this.usersService.set2FAEnabled(userId, true);
      this.usersService.set2FASecret(userId, secret);
    } else {
      this.verifyAndSet2FA(storedSecret, code);
    }
    res.cookie('_2fa', this.jwtService.sign({ id: userId }), {
      signed: true, httpOnly: false, maxAge: THREE_DAYS
    });
    return 'OK';
  }

  @Delete('me/2fa')
  async disable2FA(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body('code') code: string) {
    this.verifyAndSet2FA(await this.usersService.get2FASecret(req.user?.id), code);
    this.usersService.set2FAEnabled(req.user?.id, false);
    this.usersService.set2FASecret(req.user?.id, '');
    res.clearCookie('_2fa');
    return 'OK';
  }
}
