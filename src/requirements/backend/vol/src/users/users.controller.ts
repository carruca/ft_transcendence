import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseInterceptors,
	UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
		return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

	@Post('avatar')
	@UseInterceptors(FileInterceptor('avatar'))
	uploadAvatar(@UploadedFile() file: Express.Multer.File) {
		this.usersService.uploadAvatar(file, 0);
	}

	@Get(':id/avatar')
	getAvatar(@Param('id') id: number) {
		this.usersService.getAvatar(id);
	}

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }

	@Post(':id/nick')
	setNickname(@Param('id') id: number, @Body() body: { nick: string }) {
		return this.usersService.setNickname(id, body.nick);
	}
/*
	@Get('me')
	findMe(req: Request) {
		return this.usersService.findOne(req.user);
	}
*/
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.usersService.remove(id);
  }
}
