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
} from '@nestjs/common';
import { ReEnrolmentService } from '../services/re-enrolment.service';
import {
  CreateReEnrolmentDto,
  ReEnrolmentCourseDto,
} from '../dto/create-re-enrolment.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleCode } from '../../users/entities/role.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@Controller('re-enrolments')
export class ReEnrolmentController {
  constructor(private readonly reEnrolmentService: ReEnrolmentService) {}

  @Roles(RoleCode.STUDENT)
  @Post()
  async create(
    @Body() createDto: CreateReEnrolmentDto,
    @CurrentUser() user: User,
  ) {
    return this.reEnrolmentService.create(user.id, createDto);
  }

  @Roles(RoleCode.STUDENT)
  @Get('mine')
  async getMine(@CurrentUser() user: User) {
    return this.reEnrolmentService.findByStudent(user.id);
  }

  @Roles(RoleCode.ADMIN, RoleCode.TEACHER)
  @Get()
  async findAll() {
    return this.reEnrolmentService.findAll();
  }

  @Roles(RoleCode.ADMIN)
  @Get('pending')
  async findPending() {
    return this.reEnrolmentService.findPending();
  }

  @Roles(RoleCode.ADMIN)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reEnrolmentService.findOne(id);
  }

  @Roles(RoleCode.STUDENT)
  @Post(':id/submit')
  async submit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.reEnrolmentService.submit(id, user.id);
  }

  @Roles(RoleCode.ADMIN)
  @Post(':id/approve')
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.reEnrolmentService.approve(id, user.id);
  }

  @Roles(RoleCode.ADMIN)
  @Post(':id/reject')
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
    @CurrentUser() user: User,
  ) {
    return this.reEnrolmentService.reject(id, user.id, reason);
  }

  @Roles(RoleCode.ADMIN)
  @Post(':id/apply-to-moodle')
  async applyToMoodle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.reEnrolmentService.applyToMoodle(id, user.id);
  }

  // =====================
  // ENDPOINTS ADICIONALES PARA ESTUDIANTES
  // =====================

  @Roles(RoleCode.STUDENT)
  @Get('mine/draft/:periodId')
  async getMyDraft(
    @Param('periodId', ParseIntPipe) periodId: number,
    @CurrentUser() user: User,
  ) {
    return this.reEnrolmentService.findDraft(user.id, periodId);
  }

  @Roles(RoleCode.STUDENT)
  @Patch(':id')
  async updateDraft(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { courses: ReEnrolmentCourseDto[]; notes?: string },
    @CurrentUser() user: User,
  ) {
    return this.reEnrolmentService.updateDraft(
      id,
      user.id,
      body.courses,
      body.notes,
    );
  }

  @Roles(RoleCode.STUDENT)
  @Post(':id/add-courses')
  async addCourses(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { courses: ReEnrolmentCourseDto[] },
    @CurrentUser() user: User,
  ) {
    return this.reEnrolmentService.addCoursesToDraft(id, user.id, body.courses);
  }

  @Roles(RoleCode.STUDENT)
  @Post(':id/remove-courses')
  async removeCourses(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { courseMoodleIds: number[] },
    @CurrentUser() user: User,
  ) {
    return this.reEnrolmentService.removeCoursesFromDraft(
      id,
      user.id,
      body.courseMoodleIds,
    );
  }

  @Roles(RoleCode.STUDENT)
  @Delete(':id')
  async deleteDraft(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    await this.reEnrolmentService.deleteDraft(id, user.id);
    return { success: true };
  }

  // =====================
  // ESTADÍSTICAS (ADMIN)
  // =====================

  @Roles(RoleCode.ADMIN)
  @Get('stats')
  async getStats(@Query('periodId') periodId?: string) {
    return this.reEnrolmentService.countByStatus(
      periodId ? parseInt(periodId) : undefined,
    );
  }

  @Roles(RoleCode.ADMIN)
  @Get('by-period/:periodId')
  async getByPeriod(@Param('periodId', ParseIntPipe) periodId: number) {
    return this.reEnrolmentService.findByPeriod(periodId);
  }

  @Roles(RoleCode.ADMIN)
  @Delete('admin/:id')
  async adminDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    await this.reEnrolmentService.adminDelete(id, user.id);
    return { success: true };
  }

  @Roles(RoleCode.ADMIN)
  @Post(':id/admin/add-courses')
  async adminAddCourses(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { courses: ReEnrolmentCourseDto[] },
    @CurrentUser() user: User,
  ) {
    return this.reEnrolmentService.adminAddCourses(id, user.id, body.courses);
  }

  @Roles(RoleCode.ADMIN)
  @Post(':id/admin/remove-courses')
  async adminRemoveCourses(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { courseMoodleIds: number[] },
    @CurrentUser() user: User,
  ) {
    return this.reEnrolmentService.adminRemoveCourses(
      id,
      user.id,
      body.courseMoodleIds,
    );
  }
}
