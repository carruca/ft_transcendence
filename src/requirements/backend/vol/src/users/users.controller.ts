import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Req,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { FriendStatus } from '../friends/entities/friend.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

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
  updateMe(@Req() req: Request, @Body() body: UpdateUserDto, @UploadedFile() avatar: Express.Multer.File) {
    return this.usersService.update(req.user?.id, body, avatar);
  }

  @Put('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateAvatar(@Req() req: Request, @UploadedFile() avatar: Express.Multer.File) {
    const user = await this.usersService.findOne(req.user?.id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const avatarPath = `public/avatars/${user.nickname}.png`;
    await this.usersService.saveAvatar(avatar, avatarPath);
    return this.usersService.update(req.user?.id, user);
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
  findAchievementsUser(@Param('id') id: number) {
    return this.usersService.findAchievementsUser(id);
  }

  @Get(':id/friends')
  findFriendsUser(@Param('id') id: number) {
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
}
