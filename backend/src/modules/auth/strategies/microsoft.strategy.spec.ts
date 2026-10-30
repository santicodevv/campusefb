import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { MicrosoftStrategy } from './microsoft.strategy';

describe('MicrosoftStrategy.validate', () => {
  const user = { id: 1, email: 'juan@sebti.edu.do' };
  let authService: { validateMicrosoftUser: jest.Mock };

  const build = (env: Record<string, string>) => {
    authService = { validateMicrosoftUser: jest.fn().mockResolvedValue(user) };
    const config = { get: jest.fn((key: string) => env[key]) };
    return new MicrosoftStrategy(
      config as unknown as ConfigService,
      authService as unknown as AuthService,
    );
  };
  const profile = (email: string) => ({
    id: 'ms-1',
    displayName: 'Juan',
    emails: [{ value: email }],
  });

  it('rechaza el login en producción si falta ALLOWED_EMAIL_DOMAIN', async () => {
    const strategy = build({ NODE_ENV: 'production' });

    await expect(
      strategy.validate('a', 'r', profile('juan@sebti.edu.do')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(authService.validateMicrosoftUser).not.toHaveBeenCalled();
  });

  it('rechaza correos de otro dominio', async () => {
    const strategy = build({
      NODE_ENV: 'production',
      ALLOWED_EMAIL_DOMAIN: 'sebti.edu.do',
    });

    await expect(
      strategy.validate('a', 'r', profile('juan@gmail.com')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(authService.validateMicrosoftUser).not.toHaveBeenCalled();
  });

  it('acepta el dominio institucional sin distinguir mayúsculas', async () => {
    const strategy = build({
      NODE_ENV: 'production',
      ALLOWED_EMAIL_DOMAIN: 'sebti.edu.do',
    });

    await expect(
      strategy.validate('a', 'r', profile('juan@SEBTI.edu.do')),
    ).resolves.toBe(user);
  });

  it('en desarrollo permite cualquier dominio si no hay ALLOWED_EMAIL_DOMAIN', async () => {
    const strategy = build({ NODE_ENV: 'development' });

    await expect(
      strategy.validate('a', 'r', profile('juan@gmail.com')),
    ).resolves.toBe(user);
  });
});
