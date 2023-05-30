import {
	Injectable,
	HttpException,
	HttpStatus,
	UploadedFile,
	StreamableFile
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Readable } from 'stream';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
		const newUser = new User();
		newUser.intraId = createUserDto.id;
		newUser.name = createUserDto.name;
		newUser.login = createUserDto.login;
		newUser.achievements = [];
		return this.usersRepository.save(newUser);
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User | null> {
    const user = await this.usersRepository.findOneBy({ intraId: id });
		return user;
  }

	async setNickname(id: number, nick: string) {
    const user = await this.findOne(id);
		if (user) {
			user.nickname = nick;
			this.usersRepository.save(user);
		}
	}

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
