import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthService],
    }).compile();

    controller = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
