import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UsersService } from '../../users/users.service';
import { TokenBlacklistService } from '../services/token-blacklist.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const secret = 'test-secret';
  const user = { id: 3, email: 'luis@sebti.edu.do', isActive: true };
  let usersService: { findById: jest.Mock };
  let blacklist: { isBlacklisted: jest.Mock };
  let strategy: JwtStrategy;

  const config = (env: Record<string, string>) =>
    ({ get: jest.fn((key: string) => env[key]) }) as unknown as ConfigService;
  const requestWith = (token?: string) => ({
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });

  beforeEach(() => {
    usersService = { findById: jest.fn().mockResolvedValue(user) };
    blacklist = { isBlacklisted: jest.fn().mockResolvedValue(false) };
    strategy = new JwtStrategy(
      config({ JWT_SECRET: secret }),
      usersService as unknown as UsersService,
      blacklist as unknown as TokenBlacklistService,
    );
  });

  it('no arranca si falta JWT_SECRET', () => {
    expect(
      () =>
        new JwtStrategy(
          config({}),
          usersService as unknown as UsersService,
          blacklist as unknown as TokenBlacklistService,
        ),
    ).toThrow('JWT_SECRET');
  });

  describe('validate', () => {
    const payload = { sub: 3, email: user.email, roles: [] };

    it('devuelve el usuario activo del payload', async () => {
      await expect(
        strategy.validate(requestWith('abc'), payload),
      ).resolves.toBe(user);
      expect(usersService.findById).toHaveBeenCalledWith(3);
    });

    it('rechaza un token invalidado por logout', async () => {
      blacklist.isBlacklisted.mockResolvedValue(true);

      await expect(
        strategy.validate(requestWith('abc'), payload),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(blacklist.isBlacklisted).toHaveBeenCalledWith('abc');
      expect(usersService.findById).not.toHaveBeenCalled();
    });

    it('rechaza un usuario inactivo', async () => {
      usersService.findById.mockResolvedValue({ ...user, isActive: false });

      await expect(
        strategy.validate(requestWith('abc'), payload),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rechaza un usuario que ya no existe', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        strategy.validate(requestWith('abc'), payload),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  // Recorre passport de verdad: firma, verificación y expiración del token.
  describe('a través de JwtAuthGuard', () => {
    const jwtService = new JwtService({ secret });
    const nowInSeconds = () => Math.floor(Date.now() / 1000);

    class ProtectedController {}
    const profile = () => undefined;

    const authenticate = (token?: string) => {
      const request: Record<string, unknown> = requestWith(token);
      const context = {
        getHandler: () => profile,
        getClass: () => ProtectedController,
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({}),
        }),
      } as unknown as ExecutionContext;
      const guard = new JwtAuthGuard(new Reflector());
      return {
        request,
        result: guard.canActivate(context) as Promise<boolean>,
      };
    };

    it('acepta un token vigente y adjunta el usuario a la petición', async () => {
      const token = jwtService.sign({ sub: 3, email: user.email, roles: [] });

      const { request, result } = authenticate(token);

      await expect(result).resolves.toBe(true);
      expect(request.user).toBe(user);
    });

    it('rechaza un token expirado', async () => {
      const token = jwtService.sign({
        sub: 3,
        email: user.email,
        roles: [],
        exp: nowInSeconds() - 60,
      });

      await expect(authenticate(token).result).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(usersService.findById).not.toHaveBeenCalled();
    });

    it('rechaza un token firmado con otro secreto', async () => {
      const token = new JwtService({ secret: 'otro' }).sign({ sub: 3 });

      await expect(authenticate(token).result).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rechaza una petición sin token', async () => {
      await expect(authenticate().result).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
