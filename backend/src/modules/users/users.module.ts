import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { MoodleIntegrationModule } from '../moodle-integration/moodle-integration.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), MoodleIntegrationModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
