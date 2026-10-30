import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MoodleClientService } from '../moodle-integration/moodle-client.service';
import { MoodleUser } from '../moodle-integration/entities/moodle-user.entity';
import { Role, RoleCode } from './entities/role.entity';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService.findOrCreateSSOUser', () => {
  let service: UsersService;
  let query: Record<string, jest.Mock>;
  let userRepository: Record<string, jest.Mock>;
  const studentRole = { id: 1, code: RoleCode.STUDENT };
  const profile = {
    email: 'juan@sebti.edu.do',
    displayName: 'Juan Institucional',
    microsoftId: 'ms-1',
  };

  beforeEach(async () => {
    query = {};
    for (const method of ['leftJoinAndSelect', 'where', 'andWhere']) {
      query[method] = jest.fn().mockReturnValue(query);
    }
    query.getOne = jest.fn().mockResolvedValue(null);
    userRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(query),
      findOne: jest.fn(),
      create: jest.fn((data: Partial<User>) => ({ ...data })),
      save: jest.fn((user: Partial<User>) => Promise.resolve(user)),
    };
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        {
          provide: getRepositoryToken(Role),
          useValue: { findOne: jest.fn().mockResolvedValue(studentRole) },
        },
        { provide: getRepositoryToken(MoodleUser), useValue: {} },
        { provide: MoodleClientService, useValue: {} },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('devuelve el usuario con el mismo email sin modificarlo', async () => {
    const existing = { id: 7, email: 'Juan@sebti.edu.do', isActive: true };
    query.getOne.mockResolvedValue(existing);

    await expect(service.findOrCreateSSOUser(profile)).resolves.toBe(existing);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('compara el email exacto, sin ILIKE ni comodines', async () => {
    await service.findOrCreateSSOUser({
      ...profile,
      email: ' j_an@sebti.edu.do ',
    });

    expect(query.where).toHaveBeenCalledWith(
      'LOWER(user.email) = LOWER(:email)',
      { email: 'j_an@sebti.edu.do' },
    );
    const sql = JSON.stringify(query.where.mock.calls);
    expect(sql).not.toMatch(/ILIKE|%/i);
  });

  it('no vincula ni modifica otra cuenta que comparta el prefijo del email', async () => {
    // Ningún usuario con ese email exacto: se crea uno nuevo, no se toma juan@gmail.com
    const created = await service.findOrCreateSSOUser(profile);

    expect(query.where).toHaveBeenCalledTimes(1);
    expect(userRepository.save).toHaveBeenCalledTimes(1);
    expect(created).toMatchObject({
      email: 'juan@sebti.edu.do',
      displayName: 'Juan Institucional',
      isActive: true,
      roles: [studentRole],
    });
  });

  it('rechaza una cuenta existente inactiva', async () => {
    query.getOne.mockResolvedValue({
      id: 7,
      email: profile.email,
      isActive: false,
    });

    await expect(service.findOrCreateSSOUser(profile)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
