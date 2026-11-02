import { ConfigService } from '@nestjs/config';
import { TokenBlacklistService } from './token-blacklist.service';

describe('TokenBlacklistService (sin Redis)', () => {
  let service: TokenBlacklistService;

  beforeEach(() => {
    jest.useFakeTimers();
    const config = { get: jest.fn(() => undefined) };
    service = new TokenBlacklistService(config as unknown as ConfigService);
  });

  afterEach(() => jest.useRealTimers());

  it('marca un token como invalidado tras el logout', async () => {
    await service.add('token-a');

    await expect(service.isBlacklisted('token-a')).resolves.toBe(true);
    await expect(service.isBlacklisted('token-b')).resolves.toBe(false);
  });

  it('olvida el token pasadas 2 horas', async () => {
    await service.add('token-a');

    jest.advanceTimersByTime(2 * 60 * 60 * 1000);

    await expect(service.isBlacklisted('token-a')).resolves.toBe(false);
  });

  it('ignora tokens vacíos', async () => {
    await service.add('');

    await expect(service.isBlacklisted('')).resolves.toBe(false);
  });
});
