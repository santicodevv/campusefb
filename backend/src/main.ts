import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Prefijo global para la API
  app.setGlobalPrefix('api');

  // Seguridad HTTP (helmet)
  app.use(helmet());

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS - Usar variable de entorno o valor por defecto
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : [];

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Sistema de Gestión Académica')
    .setDescription(
      `
      API del Sistema de Gestión Académica integrado con Moodle.

      ## Características principales:
      - Autenticación JWT con roles (STUDENT, TEACHER, ADMIN)
      - Sincronización bidireccional con Moodle
      - Gestión de períodos académicos
      - Registro y consulta de calificaciones
      - Reportería con exportación a Excel/PDF
      - Generación de transcripts oficiales con verificación digital

      ## Autenticación:
      Usar el endpoint POST /api/auth/login para obtener el token JWT.
      Luego incluir el token en el header: Authorization: Bearer <token>
    `,
    )
    .setVersion('1.0')
    .addTag('auth', 'Autenticación y registro')
    .addTag('users', 'Gestión de usuarios')
    .addTag('periods', 'Períodos académicos')
    .addTag('grades', 'Calificaciones')
    .addTag('reports', 'Reportería')
    .addTag('transcripts', 'Récords oficiales')
    .addTag('health', 'Health checks')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese el token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'API Docs - Sistema Académico',
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  logger.log(`Application running on: http://localhost:${port}`);
  logger.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
  logger.log(`Health check at: http://localhost:${port}/api/health`);
}

void bootstrap();
