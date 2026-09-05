import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { PeriodsService } from '../services/periods.service';
import { CreatePeriodDto } from '../dto/create-period.dto';
import {
  ReenrolmentConfigDto,
  AddAvailableCoursesDto,
  UpdateAvailableCourseDto,
  RemoveAvailableCoursesDto,
} from '../dto/reenrolment-config.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleCode } from '../../users/entities/role.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@Controller('periods')
export class PeriodsController {
  constructor(private readonly periodsService: PeriodsService) {}

  @Roles(RoleCode.ADMIN)
  @Post()
  async create(
    @Body() createPeriodDto: CreatePeriodDto,
    @CurrentUser() user: User,
  ) {
    return this.periodsService.create(createPeriodDto, user.id);
  }

  @Get()
  async findAll() {
    return this.periodsService.findAll();
  }

  @Get('active')
  async findActive() {
    return this.periodsService.findActive();
  }

  @Get('open-for-reenrolment')
  async findOpenForReenrolment() {
    return this.periodsService.findOpenForReenrolment();
  }

  @Roles(RoleCode.ADMIN)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.periodsService.findOne(id);
  }

  @Roles(RoleCode.ADMIN)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<CreatePeriodDto>,
    @CurrentUser() user: User,
  ) {
    return this.periodsService.update(id, updateData, user.id);
  }

  @Roles(RoleCode.ADMIN)
  @Post(':id/open')
  async open(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.periodsService.open(id, user.id);
  }

  @Roles(RoleCode.ADMIN)
  @Post(':id/close')
  async close(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.periodsService.close(id, user.id);
  }

  @Roles(RoleCode.ADMIN)
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    await this.periodsService.delete(id, user.id);
    return { success: true };
  }

  // =====================
  // ENDPOINTS DE REINSCRIPCIÓN
  // =====================

  @Roles(RoleCode.ADMIN)
  @Patch(':id/reenrolment-config')
  async configureReenrolment(
    @Param('id', ParseIntPipe) id: number,
    @Body() config: ReenrolmentConfigDto,
    @CurrentUser() user: User,
  ) {
    return this.periodsService.configureReenrolment(id, config, user.id);
  }

  @Roles(RoleCode.ADMIN)
  @Post(':id/open-reenrolment')
  async openReenrolment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.periodsService.openReenrolment(id, user.id);
  }

  @Roles(RoleCode.ADMIN)
  @Post(':id/close-reenrolment')
  async closeReenrolment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.periodsService.closeReenrolment(id, user.id);
  }

  // =====================
  // CURSOS DISPONIBLES PARA REINSCRIPCIÓN
  // =====================

  @Get(':id/available-courses')
  async getAvailableCourses(@Param('id', ParseIntPipe) id: number) {
    return this.periodsService.getAvailableCourses(id);
  }

  @Roles(RoleCode.ADMIN)
  @Get(':id/available-courses/all')
  async getAllAvailableCourses(@Param('id', ParseIntPipe) id: number) {
    return this.periodsService.getAllAvailableCourses(id);
  }

  @Roles(RoleCode.ADMIN)
  @Post(':id/available-courses')
  async addAvailableCourses(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddAvailableCoursesDto,
    @CurrentUser() user: User,
  ) {
    return this.periodsService.addAvailableCourses(id, dto, user.id);
  }

  @Roles(RoleCode.ADMIN)
  @Patch(':id/available-courses/:courseMoodleId')
  async updateAvailableCourse(
    @Param('id', ParseIntPipe) id: number,
    @Param('courseMoodleId', ParseIntPipe) courseMoodleId: number,
    @Body() dto: UpdateAvailableCourseDto,
    @CurrentUser() user: User,
  ) {
    return this.periodsService.updateAvailableCourse(
      id,
      courseMoodleId,
      dto,
      user.id,
    );
  }

  @Roles(RoleCode.ADMIN)
  @Delete(':id/available-courses')
  async removeAvailableCourses(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RemoveAvailableCoursesDto,
    @CurrentUser() user: User,
  ) {
    await this.periodsService.removeAvailableCourses(
      id,
      dto.courseMoodleIds,
      user.id,
    );
    return { success: true };
  }
}
