import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('Authservice', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;
  beforeEach(async () => {
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 999999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: fakeUsersService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of an authservise', async () => {
    expect(service).toBeDefined();
  });

  it('it creates a new user with a salted and hashed password', async () => {
    const password = 'dsdsdsds';
    const user = await service.signup('pepep@test.gr', password);
    expect(user.password).not.toEqual(password);

    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('it throws an error on signup if the email already exists', async () => {
    await service.signup('fdfdfd@tt.gr', 'fdfdd');
    await expect(service.signup('fdfdfd@tt.gr', 'fdfdd')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('it throws an error if signin is called with an unused email', async () => {
    await expect(service.signin('fdfdfd@tt.gr', 'fdfdd')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws if an invalid password is provided', async () => {
    await service.signup('a@gmail.com', 'dsdsdsds');
    await expect(service.signin('a@gmail.com', 'fdfdd')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns a user if correct password is provide', async () => {
    await service.signup('pepep@test.gr', 'dsdsdsds');
    const user = await service.signin('pepep@test.gr', 'dsdsdsds');
    expect(user).toBeDefined();
  });
});
