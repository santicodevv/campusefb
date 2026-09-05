import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { entities } from './entities';

// DataSource standalone para el CLI de TypeORM (generar/ejecutar migraciones).
// Reutiliza la misma configuración que database.config.ts.
const isProduction = process.env.NODE_ENV === 'production';

const migrations = [join(__dirname, '..', 'migrations', '*.{ts,js}')];

export default new DataSource(
  process.env.DATABASE_URL
    ? {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities,
        migrations,
        ssl: { rejectUnauthorized: false },
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USER || 'moddle_user',
        password: process.env.DB_PASSWORD || 'moddle_pass',
        database: process.env.DB_NAME || 'moddle_db',
        entities,
        migrations,
        synchronize: !isProduction,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
      },
);
