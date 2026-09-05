import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { StudentGradesService } from '../services/student-grades.service';
import { UpdateStudentGradeDto } from '../dto/student-grade.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleCode } from '../../users/entities/role.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@Controller('student-grades')
export class StudentGradesController {
  constructor(private readonly studentGradesService: StudentGradesService) {}

  /**
   * Get grades for a course by period (Teacher/Admin)
   * Returns all students with their grades
   */
  @Roles(RoleCode.ADMIN, RoleCode.TEACHER)
  @Get('course/:courseMoodleId')
  async getGradesByCourse(
    @Param('courseMoodleId', ParseIntPipe) courseMoodleId: number,
    @Query('periodId', ParseIntPipe) periodId: number,
  ) {
    return this.studentGradesService.getGradesByCourse(
      courseMoodleId,
      periodId,
    );
  }

  /**
   * Update a student's grade (Teacher/Admin)
   */
  @Roles(RoleCode.ADMIN, RoleCode.TEACHER)
  @Patch('course/:courseMoodleId/student/:studentId')
  async updateGrade(
    @Param('courseMoodleId', ParseIntPipe) courseMoodleId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('periodId', ParseIntPipe) periodId: number,
    @Body() dto: UpdateStudentGradeDto,
    @CurrentUser() user: User,
  ) {
    const isAdmin = user.roles?.some((r) => r.code === RoleCode.ADMIN) || false;
    return this.studentGradesService.updateGrade(
      courseMoodleId,
      studentId,
      periodId,
      dto,
      user.id,
      isAdmin,
    );
  }

  /**
   * Get all grades for a course across all periods (Admin)
   */
  @Roles(RoleCode.ADMIN)
  @Get('course/:courseMoodleId/all-periods')
  async getCourseGradesAllPeriods(
    @Param('courseMoodleId', ParseIntPipe) courseMoodleId: number,
  ) {
    return this.studentGradesService.getCourseGradesAllPeriods(courseMoodleId);
  }

  /**
   * Sync Moodle grade sums for all students in a course (Admin)
   */
  @Roles(RoleCode.ADMIN)
  @Post('course/:courseMoodleId/sync-sums')
  async syncMoodleSums(
    @Param('courseMoodleId', ParseIntPipe) courseMoodleId: number,
    @Query('periodId', ParseIntPipe) periodId: number,
    @CurrentUser() user: User,
  ) {
    return this.studentGradesService.syncMoodleSums(
      courseMoodleId,
      periodId,
      user.id,
    );
  }

  /**
   * Get my grades (Student) - with optional filters
   */
  @Roles(RoleCode.STUDENT)
  @Get('mine')
  async getMyGrades(
    @CurrentUser() user: User,
    @Query('periodId') periodId?: string,
    @Query('courseMoodleId') courseMoodleId?: string,
  ) {
    return this.studentGradesService.getMyGrades(
      user.id,
      periodId ? parseInt(periodId, 10) : undefined,
      courseMoodleId ? parseInt(courseMoodleId, 10) : undefined,
    );
  }

  /**
   * Get periods where I have grades (Student)
   */
  @Roles(RoleCode.STUDENT)
  @Get('mine/periods')
  async getMyPeriodsWithGrades(@CurrentUser() user: User) {
    return this.studentGradesService.getMyPeriodsWithGrades(user.id);
  }

  /**
   * Get courses where I have grades for a period (Student)
   */
  @Roles(RoleCode.STUDENT)
  @Get('mine/courses')
  async getMyEnrolledCourses(
    @CurrentUser() user: User,
    @Query('periodId') periodId?: string,
  ) {
    return this.studentGradesService.getMyEnrolledCourses(
      user.id,
      periodId ? parseInt(periodId, 10) : undefined,
    );
  }

  /**
   * Get my grades for a specific period (Student)
   */
  @Roles(RoleCode.STUDENT)
  @Get('mine/period/:periodId')
  async getMyGradesByPeriod(
    @Param('periodId', ParseIntPipe) periodId: number,
    @CurrentUser() user: User,
  ) {
    return this.studentGradesService.getMyGradesByPeriod(user.id, periodId);
  }

  // =====================
  // ADMIN: Grades by Period
  // =====================

  /**
   * Get all courses with grades for a period (Admin)
   */
  @Roles(RoleCode.ADMIN)
  @Get('period/:periodId/courses')
  async getCoursesWithGradesForPeriod(
    @Param('periodId', ParseIntPipe) periodId: number,
  ) {
    return this.studentGradesService.getCoursesWithGradesForPeriod(periodId);
  }

  /**
   * Get all student grades for a specific period and course (Admin)
   */
  @Roles(RoleCode.ADMIN)
  @Get('period/:periodId/course/:courseMoodleId')
  async getGradesForPeriodAndCourse(
    @Param('periodId', ParseIntPipe) periodId: number,
    @Param('courseMoodleId', ParseIntPipe) courseMoodleId: number,
  ) {
    return this.studentGradesService.getGradesForPeriodAndCourse(
      periodId,
      courseMoodleId,
    );
  }

  // =====================
  // ADMIN: Grades by User
  // =====================

  /**
   * Search users by email or name (Admin)
   */
  @Roles(RoleCode.ADMIN)
  @Get('search-users')
  async searchUsers(@Query('q') query: string, @Query('limit') limit?: string) {
    return this.studentGradesService.searchUsers(
      query,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  /**
   * Get all grades for a specific user (Admin)
   */
  @Roles(RoleCode.ADMIN)
  @Get('user/:userId/all')
  async getAllGradesForUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.studentGradesService.getAllGradesForUser(userId);
  }
}
