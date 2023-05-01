import {
	Injectable,
	HttpException,
	HttpStatus
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
		const user = await this.usersRepository.findOneBy({ name: createUserDto.name });
		if (user) {
			throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		}
		const newUser = new User();
    newUser.intraId = createUserDto.id;
    newUser.name = createUserDto.name;
		newUser.avatar = createUserDto.avatar;
    return this.usersRepository.save(newUser);
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User | null> {
    const user = await this.usersRepository.findOneBy({ id });
		return user;
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
