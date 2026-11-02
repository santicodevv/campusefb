import { Controller, ExecutionContext, Get } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller()
class MixedController {
  @Public()
  @Get()
  login() {}

  @Get()
  profile() {}
}

@Public()
@Controller()
class PublicController {
  @Get()
  health() {}
}

describe('JwtAuthGuard', () => {
  const guard = new JwtAuthGuard(new Reflector());
  let passportCanActivate: jest.SpyInstance;

  const contextFor = (controller: new () => object, handler: string) =>
    ({
      getHandler: () =>
        (controller.prototype as Record<string, () => void>)[handler],
      getClass: () => controller,
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    passportCanActivate = jest
      .spyOn(AuthGuard('jwt').prototype, 'canActivate')
      .mockResolvedValue(true);
  });

  afterEach(() => jest.restoreAllMocks());

  it('@Public() en el método salta la autenticación JWT', () => {
    expect(guard.canActivate(contextFor(MixedController, 'login'))).toBe(true);
    expect(passportCanActivate).not.toHaveBeenCalled();
  });

  it('@Public() en el controlador salta la autenticación JWT', () => {
    expect(guard.canActivate(contextFor(PublicController, 'health'))).toBe(
      true,
    );
    expect(passportCanActivate).not.toHaveBeenCalled();
  });

  it('las rutas sin @Public() pasan por la estrategia JWT', async () => {
    const context = contextFor(MixedController, 'profile');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(passportCanActivate).toHaveBeenCalledWith(context);
  });
});
