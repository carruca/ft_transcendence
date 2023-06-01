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
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,
	) { }

	async create(createUserDto: CreateUserDto): Promise<User> {
		const newUser = new User();
		newUser.intraId = createUserDto.id;
		// This is because I have TOCs
		newUser.name = createUserDto.displayname.replace(/[\p{L}]\S*/gu, (w) => (w.replace(/^\p{L}/u, (c) => c.toUpperCase())));
		newUser.login = createUserDto.login;
		newUser.achievements = [];
		return this.usersRepository.save(newUser);
	}

	findAll(): Promise<User[]> {
		return this.usersRepository.find();
	}

	async findOneByIntraId(id: number): Promise<User | null> {
		const user = await this.usersRepository.findOneBy({ intraId: id });
		return user;
	}

	async findOne(id: number): Promise<User | null> {
		const user = await this.usersRepository.findOneBy({ id });
		return user;
	}

	async setNickname(id: number, nick: string) {
		const user = await this.findOneByIntraId(id);
		if (user) {
			user.nickname = nick;
			this.usersRepository.save(user);
		}
	}

	async update(id: number, updateUserDto: UpdateUserDto, avatar?: Express.Multer.File): Promise<User> {
		const user = await this.usersRepository.findOneBy({ id });
		if (!user) {
			throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		}
		user.nickname = updateUserDto.nickname;
		if (avatar) {
			const avatarPath = `public/avatars/${user.nickname}.png`;
			await this.saveAvatar(avatar, avatarPath);
		}
		return this.usersRepository.save(user);
	}

	async remove(id: string): Promise<void> {
		await this.usersRepository.delete(id);
	}

	async saveAvatar(file: Express.Multer.File, avatarPath: string) {
		const filePath = path.resolve(avatarPath);
		await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
		fs.writeFileSync(filePath, file.buffer);
	}
}
