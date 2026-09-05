import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { entities } from './entities';

export default registerAs('database', (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  // En producción TypeORM no sincroniza el esquema: las migraciones se aplican
  // automáticamente al iniciar la aplicación (migrationsRun).
  const migrations = [join(__dirname, '..', 'migrations', '*.{ts,js}')];

  // Si hay DATABASE_URL, usarla directamente (Railway, Neon, etc.)
  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: entities,
      synchronize: !isProduction,
      logging: !isProduction,
      ssl: { rejectUnauthorized: false },
      migrations,
      migrationsRun: isProduction,
    };
  }

  // Fallback a variables individuales para desarrollo local
  const host = process.env.DB_HOST || 'localhost';
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';

  return {
    type: 'postgres',
    host,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'moddle_user',
    password: process.env.DB_PASSWORD || 'moddle_pass',
    database: process.env.DB_NAME || 'moddle_db',
    entities: entities,
    synchronize: !isProduction,
    logging: !isProduction,
    // Neon y otros proveedores cloud requieren SSL; localhost no
    ssl: isLocalHost ? false : { rejectUnauthorized: false },
    migrations,
    migrationsRun: isProduction,
  };
});
