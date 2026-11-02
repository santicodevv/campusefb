import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { Role, RoleCode } from './../src/modules/users/entities/role.entity';
import { User } from './../src/modules/users/entities/user.entity';

// Necesita Postgres y Redis reales (ver backend/test/README.md).
describe('API (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const seededUser = {
    email: 'e2e.student@efb.test',
    username: 'e2e.student',
    password: 'E2e-Password-123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Misma configuración HTTP que main.ts
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    await seedUser();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await removeSeededUser();
    }
    await app?.close();
  });

  async function seedUser() {
    const roleRepository = dataSource.getRepository(Role);
    let studentRole = await roleRepository.findOne({
      where: { code: RoleCode.STUDENT },
    });
    if (!studentRole) {
      studentRole = await roleRepository.save({ code: RoleCode.STUDENT });
    }

    await removeSeededUser();
    await dataSource.getRepository(User).save({
      email: seededUser.email,
      username: seededUser.username,
      displayName: 'Estudiante E2E',
      passwordHash: await bcrypt.hash(seededUser.password, 10),
      isActive: true,
      roles: [studentRole],
    });
  }

  async function removeSeededUser() {
    const userRepository = dataSource.getRepository(User);
    const existing = await userRepository.findOne({
      where: { email: seededUser.email },
    });
    if (existing) {
      await userRepository.remove(existing);
    }
  }

  describe('GET /api/health', () => {
    it('responde ok', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(res.body.status).toBe('ok');
    });

    it('/db confirma que Postgres responde', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health/db')
        .expect(200);

      expect(res.body.info.database.status).toBe('up');
    });
  });

  describe('POST /api/auth/login', () => {
    it('devuelve un JWT válido para el usuario sembrado', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          identifier: seededUser.email,
          password: seededUser.password,
        })
        .expect(201);

      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user.email).toBe(seededUser.email);

      const me = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${res.body.accessToken}`)
        .expect(200);

      expect(me.body.email).toBe(seededUser.email);
      expect(me.body.roles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: RoleCode.STUDENT }),
        ]),
      );
    });

    it('acepta el username como identificador', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          identifier: seededUser.username,
          password: seededUser.password,
        })
        .expect(201);
    });

    it('rechaza una contraseña incorrecta con 401', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ identifier: seededUser.email, password: 'incorrecta' })
        .expect(401);
    });

    it('rechaza un body inválido con 400', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ identifier: seededUser.email })
        .expect(400);
    });
  });
});
