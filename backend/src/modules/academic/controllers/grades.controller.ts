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
import { GradesService } from '../services/grades.service';
import { CreateGradeDto } from '../dto/create-grade.dto';
import { UpdateGradeDto } from '../dto/update-grade.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleCode } from '../../users/entities/role.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  // ==================== SPECIFIC ROUTES FIRST ====================
  // These must be defined BEFORE any parameterized routes like :id

  /**
   * GET /grades/courses
   * Get all courses for the dropdown filter
   */
  @Get('courses')
  @Roles(RoleCode.ADMIN, RoleCode.TEACHER)
  async getCourses(@CurrentUser() user: User) {
    const isAdmin = user.roles?.some((r) => r.code === RoleCode.ADMIN) || false;
    return this.gradesService.getCourses(user.id, isAdmin);
  }

  /**
   * POST /grades/edit-session/toggle
   * Toggle grade editing on/off (admin only)
   */
  @Post('edit-session/toggle')
  @Roles(RoleCode.ADMIN)
  async toggleEditSession(@CurrentUser() user: User) {
    return this.gradesService.toggleEditSession(user.id);
  }

  /**
   * GET /grades/edit-session/status
   * Get current edit session status
   */
  @Get('edit-session/status')
  @Roles(RoleCode.ADMIN, RoleCode.TEACHER)
  async getEditSessionStatus() {
    return this.gradesService.getEditSessionStatus();
  }

  /**
   * POST /grades/edit
   * Save a grade edit (teacher)
   */
  @Post('edit')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN)
  async saveGradeEdit(
    @CurrentUser() user: User,
    @Body()
    body: {
      courseMoodleId: number;
      itemMoodleId: number;
      studentMoodleId: number;
      newGrade: number;
      feedback?: string;
    },
  ) {
    return this.gradesService.saveGradeEdit(user.id, body);
  }

  /**
   * GET /grades/my-grades
   * Obtener mis calificaciones capturadas (como profesor)
   * Filtrado opcional por curso y periodo
   */
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN)
  @Get('my-grades')
  async getMyGrades(
    @CurrentUser() user: User,
    @Query('courseId') courseId?: string,
    @Query('periodId') periodId?: string,
  ) {
    return this.gradesService.findByTeacher(
      user.id,
      courseId ? parseInt(courseId) : undefined,
      periodId ? parseInt(periodId) : undefined,
    );
  }

  /**
   * GET /grades/course/:courseMoodleId/editable
   * Get grades with editable status for teacher
   */
  @Get('course/:courseMoodleId/editable')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN)
  async getEditableGrades(
    @Param('courseMoodleId', ParseIntPipe) courseMoodleId: number,
  ) {
    return this.gradesService.getEditableGrades(courseMoodleId);
  }

  /**
   * GET /grades/course/:courseMoodleId
   * Sync and return all participants with their grades for a course
   */
  @Get('course/:courseMoodleId')
  @Roles(RoleCode.ADMIN, RoleCode.TEACHER)
  async getGradesByCourse(
    @Param('courseMoodleId', ParseIntPipe) courseMoodleId: number,
  ) {
    return this.gradesService.getGradesByCourse(courseMoodleId);
  }

  /**
   * GET /grades/student/:studentId
   * Obtener calificaciones de un estudiante
   * Los estudiantes solo pueden ver las suyas propias
   * Profesores y admins pueden ver cualquiera
   */
  @Roles(RoleCode.STUDENT, RoleCode.TEACHER, RoleCode.ADMIN)
  @Get('student/:studentId')
  async getStudentGrades(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('periodId') periodId: string | undefined,
    @CurrentUser() user: User,
  ) {
    // Validar que estudiantes solo vean sus propias calificaciones
    const isStudent = user.roles.some((role) => role.code === RoleCode.STUDENT);
    if (isStudent && user.id !== studentId) {
      throw new Error(
        'No tiene permisos para ver calificaciones de otros estudiantes',
      );
    }

    return this.gradesService.findByStudent(
      studentId,
      periodId ? parseInt(periodId) : undefined,
    );
  }

  // ==================== GENERIC ROUTES LAST ====================
  // These parameterized routes must be at the end

  /**
   * Crear una nueva calificacion
   * Solo profesores y administradores
   */
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN)
  @Post()
  async create(@Body() createDto: CreateGradeDto, @CurrentUser() user: User) {
    return this.gradesService.create(createDto, user.id);
  }

  /**
   * Actualizar una calificacion existente
   * Solo el profesor propietario o administradores
   */
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateGradeDto,
    @CurrentUser() user: User,
  ) {
    return this.gradesService.update(id, updateDto, user.id);
  }

  /**
   * Obtener una calificacion especifica
   * IMPORTANT: This must be LAST to avoid catching other routes
   */
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gradesService.findOne(id);
  }
}
