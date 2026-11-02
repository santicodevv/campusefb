import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RoleCode } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

describe('AuthService', () => {
  const jwtService = new JwtService({
    secret: 'test-secret',
    signOptions: { expiresIn: '1h' },
  });
  let usersService: {
    findByEmailOrUsername: jest.Mock;
    validatePassword: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    findOrCreateSSOUser: jest.Mock;
  };
  let service: AuthService;

  const buildUser = (overrides: Partial<User> = {}) =>
    ({
      id: 7,
      email: 'ana@sebti.edu.do',
      passwordHash: 'hash',
      isActive: true,
      roles: [{ code: RoleCode.TEACHER }, { code: RoleCode.ADMIN }],
      ...overrides,
    }) as User;

  beforeEach(() => {
    usersService = {
      findByEmailOrUsername: jest.fn(),
      validatePassword: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findOrCreateSSOUser: jest.fn(),
    };
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService,
    );
  });

  describe('login', () => {
    const credentials = { identifier: 'ana', password: 'secreta' };

    it('devuelve un JWT con id, email y roles del usuario', async () => {
      const user = buildUser();
      usersService.findByEmailOrUsername.mockResolvedValue(user);
      usersService.validatePassword.mockResolvedValue(true);

      const result = await service.login(credentials);

      expect(result.user).toBe(user);
      expect(usersService.validatePassword).toHaveBeenCalledWith(
        'secreta',
        'hash',
      );
      const payload = jwtService.verify<JwtPayload & { exp: number }>(
        result.accessToken,
      );
      expect(payload).toMatchObject({
        sub: 7,
        email: 'ana@sebti.edu.do',
        roles: [RoleCode.TEACHER, RoleCode.ADMIN],
      });
    });

    it('firma el token con expiración', async () => {
      usersService.findByEmailOrUsername.mockResolvedValue(buildUser());
      usersService.validatePassword.mockResolvedValue(true);

      const { accessToken } = await service.login(credentials);

      const { iat, exp } = jwtService.decode<{ iat: number; exp: number }>(
        accessToken,
      );
      expect(exp - iat).toBe(3600);
    });

    it('rechaza un usuario inexistente', async () => {
      usersService.findByEmailOrUsername.mockResolvedValue(null);

      await expect(service.login(credentials)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(usersService.validatePassword).not.toHaveBeenCalled();
    });

    it('rechaza una contraseña incorrecta', async () => {
      usersService.findByEmailOrUsername.mockResolvedValue(buildUser());
      usersService.validatePassword.mockResolvedValue(false);

      await expect(service.login(credentials)).rejects.toThrow(
        'Credenciales incorrectas',
      );
    });

    it('rechaza un usuario inactivo con el mismo mensaje genérico', async () => {
      usersService.findByEmailOrUsername.mockResolvedValue(
        buildUser({ isActive: false }),
      );
      usersService.validatePassword.mockResolvedValue(true);

      await expect(service.login(credentials)).rejects.toThrow(
        'Credenciales incorrectas',
      );
    });
  });

  describe('loginSSO', () => {
    it('firma un JWT con los roles del usuario', () => {
      const { accessToken } = service.loginSSO(buildUser());

      expect(jwtService.verify<JwtPayload>(accessToken).roles).toEqual([
        RoleCode.TEACHER,
        RoleCode.ADMIN,
      ]);
    });

    it('usa una lista vacía si el usuario no trae roles', () => {
      const { accessToken } = service.loginSSO(buildUser({ roles: undefined }));

      expect(jwtService.verify<JwtPayload>(accessToken).roles).toEqual([]);
    });
  });

  it('register delega en UsersService y devuelve el usuario creado', async () => {
    const user = buildUser();
    usersService.create.mockResolvedValue(user);
    const dto = { email: user.email } as never;

    const result = await service.register(dto);

    expect(usersService.create).toHaveBeenCalledWith(dto);
    expect(result.user).toBe(user);
  });

  it('validateMicrosoftUser delega en findOrCreateSSOUser', async () => {
    const user = buildUser();
    usersService.findOrCreateSSOUser.mockResolvedValue(user);
    const profile = {
      email: user.email,
      displayName: 'Ana',
      microsoftId: 'ms-7',
    };

    await expect(service.validateMicrosoftUser(profile)).resolves.toBe(user);
    expect(usersService.findOrCreateSSOUser).toHaveBeenCalledWith(profile);
  });
});
