import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
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
import { CreateBlockDto } from './dto/create-block.dto';
import { CreateBanDto } from './dto/create-ban.dto';

import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Request, Response } from 'express';
import {
  ApiTags,
} from '@nestjs/swagger';
import { FriendStatus } from '../friends/entities/friend.entity';
import { JwtService } from '@nestjs/jwt';
import * as speakeasy from 'speakeasy';

const THREE_DAYS = 1000 * 60 * 60 * 24 * 3;

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

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
    return this.usersService.findUserFriends(req.user?.id);
  }

  @Get('me/pending-friends')
  findMyPendingFriends(@Req() req: Request) {
    return this.usersService.findUserFriends(
      req.user?.id,
      FriendStatus.requested
    );
  }

  @Get(':id/channels')
  findChannelsUser(@Param('id') id: string) {
    return this.usersService.findChannelsUser(id);
	}

  @Get(':id/achievements')
  findAchievementsUser(@Param('id') id: string) {
    return this.usersService.findAchievementsUser(id);
  }

  @Get(':id/friends')
  findFriendsUser(
    @Param('id') id: string,
    @Body('status') status?: FriendStatus
  ) {
    return this.usersService.findUserFriends(id, status);
  }

  @Post('block')
  createBlock(@Body() createBlockDto: CreateBlockDto) {
    return this.usersService.createBlock(createBlockDto);
  }

  @Delete('block')
  removeBlock(@Body() createBlockDto: CreateBlockDto) {
    return this.usersService.removeBlock(
      createBlockDto.userId,
      createBlockDto.blockId
    );
  }

  @Get(':id/blocks')
  getBlocks(@Param('userId') userId: string) {
    return this.usersService.getBlocks(userId);
  }

  @Post('ban')
  createBan(@Body() createBanDto: CreateBanDto) {
    return this.usersService.createBan(createBanDto);
  }

  @Delete('ban')
  removeBan(@Body() createBanDto: CreateBanDto) {
    return this.usersService.removeBan(
      createBanDto.userId,
      createBanDto.channelId
    );
  }
/*
  @Get(':id/bans')
  getBansByUser(@Param('userId') userId: string) {
    return this.usersService.getBansByUser(userId);
  }
*/
  @Get('leaderboard')
  async getLeaderboard() {
    return this.usersService.getLeaderboard();
  }

  @Get(':nickname')
  findOneByNickname(@Param('nickname') nickname: string) {
    return this.usersService.findOneByNickname(nickname);
  }

  @Get('nickname/:nickname')
  async findNickname(@Param('nickname') nickname: string) {
    const nickRegex = /^[\w](?!.*?\.{2})[\w.]{1,28}[\w]$/;
    if (nickname.length < 3 || nickname.length > 20) {
      throw new HttpException('Nickname too short', HttpStatus.BAD_REQUEST);
    }
    try {
      const user = await this.usersService.findOneByNickname(nickname);
      if (user) {
        throw new HttpException('Nickname already taken', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND) {
        if (!nickRegex.test(nickname)) {
          throw new HttpException('Invalid nickname', HttpStatus.BAD_REQUEST);
        }
        return 'Nickname available';
      }
      throw error;
    }
    if (!nickRegex.test(nickname)) {
      throw new HttpException('Invalid nickname', HttpStatus.BAD_REQUEST);
    }
    return 'Nickname available';
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
