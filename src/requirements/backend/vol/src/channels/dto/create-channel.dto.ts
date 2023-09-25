import { User } from '../../users/entities/user.entity';

export class CreateChannelDto {
	uuid?: string;
	name: string;
	owner?: User;
	successor?: User;
	topic?: string;
	password?: string;
}
