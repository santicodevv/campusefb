import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../users/entities/role.entity';
import { GradesService } from './grades.service';

@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  /**
   * GET /grades/courses
   * Get all courses for the dropdown filter
   * IMPORTANT: This must be BEFORE any :param routes to avoid conflicts
   */
  @Get('courses')
  @Roles(RoleCode.ADMIN, RoleCode.TEACHER)
  async getCourses(@Request() req: any) {
    const isAdmin =
      req.user.roles?.some(
        (r: any) => r.code === RoleCode.ADMIN || r === RoleCode.ADMIN,
      ) ?? false;
    return this.gradesService.getCourses(req.user.id, isAdmin);
  }

  /**
   * POST /grades/edit-session/toggle
   * Toggle grade editing on/off (admin only)
   */
  @Post('edit-session/toggle')
  @Roles(RoleCode.ADMIN)
  async toggleEditSession(@Request() req: any) {
    return this.gradesService.toggleEditSession(req.user.id);
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
    @Request() req: any,
    @Body()
    body: {
      courseMoodleId: number;
      itemMoodleId: number;
      studentMoodleId: number;
      newGrade: number;
      feedback?: string;
    },
  ) {
    const isAdmin =
      req.user.roles?.some(
        (r: any) => r.code === RoleCode.ADMIN || r === RoleCode.ADMIN,
      ) ?? false;
    return this.gradesService.saveGradeEdit(req.user.id, body, isAdmin);
  }

  /**
   * DELETE /grades/edit/:id
   * Revert a grade edit (teacher)
   */
  @Delete('edit/:id')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN)
  async deleteGradeEdit(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const isAdmin =
      req.user.roles?.some(
        (r: any) => r.code === RoleCode.ADMIN || r === RoleCode.ADMIN,
      ) ?? false;
    return this.gradesService.deleteGradeEdit(id, req.user.id, isAdmin);
  }

  /**
   * GET /grades/course/:courseMoodleId/editable
   * Get grades with editable status for teacher
   * IMPORTANT: This must be BEFORE the generic :courseMoodleId route
   */
  @Get('course/:courseMoodleId/editable')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN)
  async getEditableGrades(
    @Param('courseMoodleId', ParseIntPipe) courseMoodleId: number,
    @Request() req: any,
  ) {
    const isAdmin =
      req.user.roles?.some(
        (r: any) => r.code === RoleCode.ADMIN || r === RoleCode.ADMIN,
      ) ?? false;
    return this.gradesService.getEditableGrades(
      courseMoodleId,
      req.user.id,
      isAdmin,
    );
  }

  /**
   * GET /grades/course/:courseMoodleId
   * Sync and return all participants with their grades for a course
   * IMPORTANT: This must be LAST among GET routes to avoid catching other paths
   */
  @Get('course/:courseMoodleId')
  @Roles(RoleCode.ADMIN, RoleCode.TEACHER)
  async getGradesByCourse(
    @Param('courseMoodleId', ParseIntPipe) courseMoodleId: number,
  ) {
    return this.gradesService.getGradesByCourse(courseMoodleId);
  }
}
