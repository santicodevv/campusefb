import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { MicrosoftCallbackGuard } from './microsoft-auth.guard';

describe('MicrosoftCallbackGuard.handleRequest', () => {
  const originalFrontendUrl = process.env.FRONTEND_URL;
  const guard = new MicrosoftCallbackGuard();
  let res: { redirect: jest.Mock; status: jest.Mock; send: jest.Mock };
  let context: ExecutionContext;

  beforeEach(() => {
    process.env.FRONTEND_URL = 'https://campus.test';
    res = { redirect: jest.fn(), status: jest.fn(), send: jest.fn() };
    res.status.mockReturnValue(res);
    context = {
      switchToHttp: () => ({ getResponse: () => res }),
    } as unknown as ExecutionContext;
  });

  afterAll(() => {
    process.env.FRONTEND_URL = originalFrontendUrl;
  });

  it('devuelve el usuario cuando la autenticación fue correcta', () => {
    const user = { id: 1 };

    expect(guard.handleRequest(null, user, undefined, context)).toBe(user);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('redirige al login con el mensaje del error de validate()', () => {
    const err = new UnauthorizedException('Dominio no permitido');

    expect(guard.handleRequest(err, false, undefined, context)).toBeNull();
    expect(res.redirect).toHaveBeenCalledWith(
      'https://campus.test/login?sso_error=Dominio%20no%20permitido',
    );
  });

  it('usa el mensaje de info si passport no devolvió usuario', () => {
    guard.handleRequest(null, false, { message: 'Sin código' }, context);

    expect(res.redirect).toHaveBeenCalledWith(
      `https://campus.test/login?sso_error=${encodeURIComponent('Sin código')}`,
    );
  });

  it('responde 500 si FRONTEND_URL no está configurada', () => {
    delete process.env.FRONTEND_URL;

    expect(
      guard.handleRequest(new Error('x'), false, undefined, context),
    ).toBeNull();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
