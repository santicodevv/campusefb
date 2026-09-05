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
  NotFoundException,
} from '@nestjs/common';
import { CoursesService } from '../services/courses.service';
import { CreateCourseDto } from '../dto/create-course.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleCode } from '../../users/entities/role.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  /**
   * Get all categories
   */
  @Roles(RoleCode.ADMIN)
  @Get('categories')
  async getCategories() {
    return this.coursesService.getCategories();
  }

  /**
   * Sync categories from Moodle
   */
  @Roles(RoleCode.ADMIN)
  @Post('categories/sync')
  async syncCategories() {
    return this.coursesService.syncCategories();
  }

  /**
   * Create a new course
   */
  @Roles(RoleCode.ADMIN)
  @Post()
  async createCourse(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.createCourse(createCourseDto);
  }

  /**
   * Get all courses with pagination
   * Accessible by all authenticated users (for dropdowns, etc.)
   */
  @Roles(RoleCode.ADMIN, RoleCode.TEACHER, RoleCode.STUDENT)
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.coursesService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
    });
  }

  /**
   * Get courses enrolled by current user (student)
   */
  @Roles(RoleCode.STUDENT)
  @Get('enrolled')
  async getMyEnrolledCourses(@CurrentUser() user: User) {
    if (!user.moodleUserId) {
      return [];
    }
    return this.coursesService.getCoursesForUser(user.moodleUserId);
  }

  /**
   * Get a single course by ID
   */
  @Roles(RoleCode.ADMIN, RoleCode.TEACHER)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const course = await this.coursesService.findOne(id);
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    return course;
  }

  /**
   * Get course details with enrollments
   */
  @Roles(RoleCode.ADMIN, RoleCode.TEACHER)
  @Get(':id/details')
  async getCourseDetails(@Param('id', ParseIntPipe) id: number) {
    const details = await this.coursesService.getCourseDetails(id);
    if (!details) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    return details;
  }

  /**
   * Get enrolled users with details for a course
   */
  @Roles(RoleCode.ADMIN, RoleCode.TEACHER)
  @Get(':id/enrolled-users')
  async getEnrolledUsers(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.getEnrolledUsersWithDetails(id);
  }

  /**
   * Delete a course (local only)
   */
  @Roles(RoleCode.ADMIN)
  @Delete(':id')
  async deleteCourse(@Param('id', ParseIntPipe) id: number) {
    await this.coursesService.delete(id);
    return { success: true };
  }

  /**
   * Update course subject name (local only)
   */
  @Roles(RoleCode.ADMIN)
  @Patch(':id/subject-name')
  async updateSubjectName(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { subjectName: string },
  ) {
    return this.coursesService.updateSubjectName(id, body.subjectName);
  }

  /**
   * Update course code (local only)
   */
  @Roles(RoleCode.ADMIN)
  @Patch(':id/code')
  async updateCode(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { code: string },
  ) {
    return this.coursesService.updateCode(id, body.code);
  }

  /**
   * Toggle course visibility (syncs with Moodle)
   */
  @Roles(RoleCode.ADMIN)
  @Patch(':id/visibility')
  async toggleVisibility(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.toggleVisibility(id, user.id);
  }

  // =====================
  // TEACHER ASSIGNMENT ENDPOINTS
  // =====================

  /**
   * Get teachers assigned to a course
   */
  @Roles(RoleCode.ADMIN, RoleCode.TEACHER)
  @Get(':courseMoodleId/teachers')
  async getTeachersForCourse(
    @Param('courseMoodleId', ParseIntPipe) courseMoodleId: number,
  ) {
    return this.coursesService.getTeachersForCourse(courseMoodleId);
  }

  /**
   * Assign teachers to a course
   */
  @Roles(RoleCode.ADMIN)
  @Post(':courseMoodleId/teachers')
  async assignTeachers(
    @Param('courseMoodleId', ParseIntPipe) courseMoodleId: number,
    @Body() body: { teacherIds: number[]; courseName?: string },
    @CurrentUser() user: User,
  ) {
    return this.coursesService.assignTeachers(
      courseMoodleId,
      body.teacherIds,
      user.id,
      body.courseName,
    );
  }

  /**
   * Remove a teacher from a course
   */
  @Roles(RoleCode.ADMIN)
  @Delete(':courseMoodleId/teachers/:teacherId')
  async removeTeacher(
    @Param('courseMoodleId', ParseIntPipe) courseMoodleId: number,
    @Param('teacherId', ParseIntPipe) teacherId: number,
    @CurrentUser() user: User,
  ) {
    await this.coursesService.removeTeacher(courseMoodleId, teacherId, user.id);
    return { success: true };
  }

  /**
   * Set a teacher as primary for a course
   */
  @Roles(RoleCode.ADMIN)
  @Post(':courseMoodleId/teachers/:teacherId/primary')
  async setPrimaryTeacher(
    @Param('courseMoodleId', ParseIntPipe) courseMoodleId: number,
    @Param('teacherId', ParseIntPipe) teacherId: number,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.setPrimaryTeacher(
      courseMoodleId,
      teacherId,
      user.id,
    );
  }

  /**
   * Get courses where a teacher is assigned
   */
  @Roles(RoleCode.ADMIN, RoleCode.TEACHER)
  @Get('teacher/:teacherId/courses')
  async getCoursesForTeacher(
    @Param('teacherId', ParseIntPipe) teacherId: number,
  ) {
    return this.coursesService.getCoursesForTeacher(teacherId);
  }
}
