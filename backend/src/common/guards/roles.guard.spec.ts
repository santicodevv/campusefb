import { Controller, ExecutionContext, Get } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleCode } from '../../modules/users/entities/role.entity';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

@Roles(RoleCode.ADMIN)
@Controller()
class AdminController {
  @Get()
  dashboard() {}

  @Roles(RoleCode.TEACHER, RoleCode.STUDENT)
  @Get()
  courses() {}
}

@Controller()
class OpenController {
  @Get()
  info() {}
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  const contextFor = (
    controller: new () => object,
    handler: string,
    user?: { roles?: { code: RoleCode }[] },
  ) =>
    ({
      getHandler: () =>
        (controller.prototype as Record<string, () => void>)[handler],
      getClass: () => controller,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;
  const withRoles = (...codes: RoleCode[]) => ({
    roles: codes.map((code) => ({ code })),
  });

  it('deja pasar rutas sin @Roles', () => {
    expect(guard.canActivate(contextFor(OpenController, 'info'))).toBe(true);
  });

  it.each([
    [RoleCode.ADMIN, true],
    [RoleCode.TEACHER, false],
    [RoleCode.STUDENT, false],
  ])('@Roles(ADMIN) en la clase con rol %s → %s', (role, expected) => {
    expect(
      guard.canActivate(
        contextFor(AdminController, 'dashboard', withRoles(role)),
      ),
    ).toBe(expected);
  });

  it.each([
    [RoleCode.TEACHER, true],
    [RoleCode.STUDENT, true],
    [RoleCode.ADMIN, false],
  ])(
    '@Roles(TEACHER, STUDENT) en el método reemplaza al de la clase: rol %s → %s',
    (role, expected) => {
      expect(
        guard.canActivate(
          contextFor(AdminController, 'courses', withRoles(role)),
        ),
      ).toBe(expected);
    },
  );

  it('acepta si alguno de los roles del usuario coincide', () => {
    expect(
      guard.canActivate(
        contextFor(
          AdminController,
          'dashboard',
          withRoles(RoleCode.STUDENT, RoleCode.ADMIN),
        ),
      ),
    ).toBe(true);
  });

  it('rechaza si no hay usuario en la petición', () => {
    expect(guard.canActivate(contextFor(AdminController, 'dashboard'))).toBe(
      false,
    );
  });

  it('rechaza si el usuario no trae roles', () => {
    expect(
      guard.canActivate(contextFor(AdminController, 'dashboard', {})),
    ).toBe(false);
  });
});
