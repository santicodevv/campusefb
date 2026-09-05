import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';

// Módulos de la aplicación
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { MoodleIntegrationModule } from './modules/moodle-integration/moodle-integration.module';
import { SyncModule } from './modules/sync/sync.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AcademicModule } from './modules/academic/academic.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TranscriptsModule } from './modules/transcripts/transcripts.module';
import { HealthModule } from './modules/health/health.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AcademicProjectionModule } from './modules/academic-projection/academic-projection.module';

// Guards globales
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

// Interceptors
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig],
      // Busca .env en backend/ primero, luego en la carpeta raíz del proyecto
      envFilePath: ['.env', '../.env'],
    }),

    // TypeORM - PostgreSQL
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database')!,
    }),

    // BullMQ - Redis Queue
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: configService.get('redis'),
      }),
    }),

    // Rate limiting (Throttler)
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Módulos de la aplicación
    UsersModule,
    AuthModule,
    MoodleIntegrationModule,
    SyncModule,
    WebhooksModule,
    AcademicModule,
    ReportsModule,
    TranscriptsModule,
    HealthModule,
    PaymentsModule,
    AcademicProjectionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Guards globales
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Interceptor de logging global
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
