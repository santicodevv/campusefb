import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { RoleCode } from './entities/role.entity';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(RoleCode.ADMIN)
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  /**
   * Admin-only endpoint to create a user with roles
   */
  @Roles(RoleCode.ADMIN)
  @Post('admin/create')
  async adminCreate(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  /**
   * Admin-only: crear un profesor con rol TEACHER y sincronización a Moodle
   */
  @Roles(RoleCode.ADMIN)
  @Post('admin/create-teacher')
  async adminCreateTeacher(@Body() dto: CreateTeacherDto): Promise<User> {
    return this.usersService.createTeacher(dto);
  }

  @Roles(RoleCode.ADMIN)
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('role') role?: string,
  ) {
    const isActiveParsed =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.usersService.findAllPaginated(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
      isActiveParsed,
      role,
    );
  }

  @Roles(RoleCode.ADMIN)
  @Get('roles')
  async getRoles() {
    return this.usersService.getAllRoles();
  }

  /**
   * Get all users with teacher role
   */
  @Roles(RoleCode.ADMIN)
  @Get('teachers')
  async getTeachers() {
    return this.usersService.findTeachers();
  }

  @Roles(RoleCode.ADMIN)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findById(id);
  }

  @Roles(RoleCode.ADMIN)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Roles(RoleCode.ADMIN)
  @Delete(':id')
  @HttpCode(200)
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; message: string }> {
    await this.usersService.delete(id);
    return { success: true, message: 'Usuario eliminado correctamente' };
  }

  @Roles(RoleCode.ADMIN)
  @Post(':id/roles/:roleCode')
  async addRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('roleCode') roleCode: RoleCode,
  ): Promise<User> {
    return this.usersService.addRoleToUser(id, roleCode);
  }
}
