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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Request } from 'express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
		return this.usersService.create(createUserDto);
  }

	@Put()
	update(@Body() updateUserDto: UpdateUserDto) {
	}
	//TODO:
	/*
	*		Put() updateUser
	*		Interceptor checkUSer is in database
	*/

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }

	@Post(':id/nick')
	setNickname(@Param('id') id: number, @Body() body: { nick: string }) {
		return this.usersService.setNickname(id, body.nick);
	}

	@Get('me')
	findMe(@Req() req: Request) {
		return this.usersService.findOne(req.user?.id);
	}

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.usersService.remove(id);
  }
}
