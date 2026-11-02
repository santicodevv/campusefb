import { Role, RoleCode } from './role.entity';
import { User } from './user.entity';

describe('User', () => {
  function buildUser(): User {
    const role = Object.assign(new Role(), { id: 1, code: RoleCode.STUDENT });
    return Object.assign(new User(), {
      id: 7,
      email: 'ana@efb.test',
      passwordHash: '$2b$10$hash',
      displayName: 'Ana',
      roles: [role],
    });
  }

  it('no incluye passwordHash al serializar a JSON', () => {
    const json = JSON.parse(JSON.stringify(buildUser())) as Record<
      string,
      unknown
    >;

    expect(json).not.toHaveProperty('passwordHash');
    expect(json).toMatchObject({
      id: 7,
      email: 'ana@efb.test',
      displayName: 'Ana',
      roles: [{ id: 1, code: RoleCode.STUDENT }],
    });
  });

  it('conserva propiedades dinámicas como lastLoginAt', () => {
    const user = buildUser();
    user.lastLoginAt = 1700000000;

    const json = JSON.parse(JSON.stringify(user)) as Record<string, unknown>;

    expect(json.lastLoginAt).toBe(1700000000);
  });

  it('tampoco lo incluye cuando el usuario va anidado o en un array', () => {
    const body = JSON.stringify({ accessToken: 'jwt', users: [buildUser()] });

    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain('$2b$10$hash');
  });

  it('no modifica la entidad original', () => {
    const user = buildUser();
    JSON.stringify(user);

    expect(user.passwordHash).toBe('$2b$10$hash');
  });
});
