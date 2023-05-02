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
		const user = await this.usersRepository.findOneBy({ intraId: createUserDto.id });
		if (!user) {
			const newUser = new User();
			newUser.intraId = createUserDto.id;
			newUser.name = createUserDto.name;
			newUser.avatar = createUserDto.avatar;
			return this.usersRepository.save(newUser);
		}
		return user;
  }

	async uploadAvatar(@UploadedFile() file: Express.Multer.File, id: number): Promise<void> {
    const user = await this.usersRepository.findOneBy({ intraId: id });
		if (user) {
			user.avatar = file.buffer.toString('base64');
	//		console.log(user.avatar);
			await this.usersRepository.save(user);
		}
	}

	async getAvatar(id: number): Promise<StreamableFile | void> {
    const user = await this.findOne(id);
		if (user && user.avatar) {
			const buffer = Buffer.from(user.avatar, 'base64');
	//		console.log(buffer);
			const stream = new Readable();
			stream.push(buffer);
			stream.push(null);
		//	console.log(stream);
			return new StreamableFile(stream);
		}
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
