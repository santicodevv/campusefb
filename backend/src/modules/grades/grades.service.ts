import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MoodleSyncService } from '../moodle-integration/moodle-sync.service';
import { MoodleGrade } from '../moodle-integration/entities/moodle-grade.entity';
import { MoodleGradeItem } from '../moodle-integration/entities/moodle-grade-item.entity';
import { MoodleEnrolment } from '../moodle-integration/entities/moodle-enrolment.entity';
import { MoodleUser } from '../moodle-integration/entities/moodle-user.entity';
import { MoodleCourse } from '../moodle-integration/entities/moodle-course.entity';
import { GradeEditSession } from '../academic/entities/grade-edit-session.entity';
import { GradeEdit } from '../academic/entities/grade-edit.entity';
import { CourseTeacher } from '../academic/entities/course-teacher.entity';

@Injectable()
export class GradesService {
  private readonly logger = new Logger(GradesService.name);

  constructor(
    private readonly moodleSyncService: MoodleSyncService,
    @InjectRepository(MoodleGrade)
    private readonly moodleGradeRepository: Repository<MoodleGrade>,
    @InjectRepository(MoodleGradeItem)
    private readonly moodleGradeItemRepository: Repository<MoodleGradeItem>,
    @InjectRepository(MoodleEnrolment)
    private readonly moodleEnrolmentRepository: Repository<MoodleEnrolment>,
    @InjectRepository(MoodleUser)
    private readonly moodleUserRepository: Repository<MoodleUser>,
    @InjectRepository(MoodleCourse)
    private readonly moodleCourseRepository: Repository<MoodleCourse>,
    @InjectRepository(GradeEditSession)
    private readonly gradeEditSessionRepository: Repository<GradeEditSession>,
    @InjectRepository(GradeEdit)
    private readonly gradeEditRepository: Repository<GradeEdit>,
    @InjectRepository(CourseTeacher)
    private readonly courseTeacherRepository: Repository<CourseTeacher>,
  ) {}

  /**
   * Sync and return all participants with their grades for a course
   */
  async getGradesByCourse(courseMoodleId: number) {
    // Sync grades and grade items from Moodle
    try {
      await this.moodleSyncService.syncGradeItems(courseMoodleId);
      await this.moodleSyncService.syncGrades(courseMoodleId);
      await this.moodleSyncService.syncEnrolments(courseMoodleId);
    } catch (error) {
      this.logger.warn(
        `Sync failed for course ${courseMoodleId}, using cached data: ${error.message}`,
      );
    }

    // Get course info
    const course = await this.moodleCourseRepository.findOne({
      where: { moodleId: courseMoodleId },
    });

    // Get grade items for this course
    const gradeItems = await this.moodleGradeItemRepository.find({
      where: { courseMoodleId },
      order: { itemMoodleId: 'ASC' },
    });

    // Get enrolled students (role 'student')
    const enrolments = await this.moodleEnrolmentRepository.find({
      where: { courseMoodleId, roleCode: 'student' },
    });

    const studentMoodleIds = enrolments.map((e) => Number(e.userMoodleId));

    // Get student info
    const students = await this.moodleUserRepository
      .createQueryBuilder('u')
      .where('u.moodleId IN (:...ids)', {
        ids: studentMoodleIds.length > 0 ? studentMoodleIds : [0],
      })
      .getMany();

    // Get all grades for this course
    const grades = await this.moodleGradeRepository.find({
      where: { courseMoodleId },
    });

    // Get active edit session
    const activeSession = await this.getActiveSession();

    // Get grade edits for the active session (if any)
    let gradeEdits: GradeEdit[] = [];
    if (activeSession) {
      gradeEdits = await this.gradeEditRepository.find({
        where: { sessionId: activeSession.id, courseMoodleId },
      });
    }

    // Build the response: participants with their grades
    const participants = students.map((student) => {
      const studentGrades = gradeItems.map((item) => {
        const moodleGrade = grades.find(
          (g) =>
            Number(g.itemMoodleId) === Number(item.itemMoodleId) &&
            Number(g.userMoodleId) === Number(student.moodleId),
        );

        // Check if there's an edit for this grade in the active session
        const edit = gradeEdits.find(
          (e) =>
            Number(e.itemMoodleId) === Number(item.itemMoodleId) &&
            Number(e.studentMoodleId) === Number(student.moodleId),
        );

        return {
          itemMoodleId: Number(item.itemMoodleId),
          itemName: item.itemname,
          gradeMax: Number(item.grademax),
          gradeMin: Number(item.grademin),
          moodleGrade: moodleGrade ? Number(moodleGrade.grade) : null,
          editedGrade: edit ? Number(edit.newGrade) : null,
          feedback: edit?.feedback || moodleGrade?.feedback || null,
          wasEdited: !!edit,
          editId: edit ? edit.id : undefined,
        };
      });

      return {
        studentMoodleId: Number(student.moodleId),
        studentName:
          `${student.firstname || ''} ${student.lastname || ''}`.trim(),
        studentEmail: student.email,
        grades: studentGrades,
      };
    });

    return {
      course: course
        ? {
            moodleId: Number(course.moodleId),
            fullname: course.fullname,
            shortname: course.shortname,
          }
        : null,
      gradeItems: gradeItems.map((item) => ({
        itemMoodleId: Number(item.itemMoodleId),
        itemName: item.itemname,
        itemType: item.itemtype,
        gradeMax: Number(item.grademax),
        gradeMin: Number(item.grademin),
        weight: item.weight ? Number(item.weight) : null,
      })),
      participants,
      editSession: activeSession
        ? {
            id: activeSession.id,
            isActive: activeSession.isActive,
            activatedAt: activeSession.activatedAt,
          }
        : null,
    };
  }

  /**
   * Get all courses (for dropdown). If not admin, returns only assigned courses.
   */
  async getCourses(teacherUserId?: number, isAdmin: boolean = false) {
    if (!isAdmin && teacherUserId) {
      // Find courses where the user is a teacher
      const assignments = await this.courseTeacherRepository.find({
        where: { teacherId: teacherUserId },
        select: ['courseMoodleId'],
      });
      const assignedCourseIds = assignments.map((a) =>
        Number(a.courseMoodleId),
      );

      if (assignedCourseIds.length === 0) {
        return [];
      }

      return this.moodleCourseRepository
        .createQueryBuilder('c')
        .where('c.moodleId IN (:...ids)', { ids: assignedCourseIds })
        .orderBy('c.fullname', 'ASC')
        .getMany();
    }

    // Admins see all courses
    return this.moodleCourseRepository.find({
      order: { fullname: 'ASC' },
    });
  }

  /**
   * Toggle grade edit session (admin)
   */
  async toggleEditSession(adminUserId: number) {
    const activeSession = await this.getActiveSession();

    if (activeSession) {
      // Deactivate the current session
      activeSession.isActive = false;
      activeSession.deactivatedAt = new Date();
      await this.gradeEditSessionRepository.save(activeSession);

      return {
        action: 'deactivated',
        session: activeSession,
        message: 'Edición de notas deshabilitada',
      };
    } else {
      // Create a new active session
      const newSession = this.gradeEditSessionRepository.create({
        isActive: true,
        activatedBy: adminUserId,
        activatedAt: new Date(),
      });
      const saved = await this.gradeEditSessionRepository.save(newSession);

      return {
        action: 'activated',
        session: saved,
        message: 'Edición de notas habilitada',
      };
    }
  }

  /**
   * Get the current active edit session
   */
  async getActiveSession(): Promise<GradeEditSession | null> {
    return this.gradeEditSessionRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get edit session status
   */
  async getEditSessionStatus() {
    const session = await this.getActiveSession();
    return {
      isActive: session?.isActive || false,
      session: session || null,
    };
  }

  /**
   * Save a grade edit (teacher)
   */
  async saveGradeEdit(
    teacherUserId: number,
    data: {
      courseMoodleId: number;
      itemMoodleId: number;
      studentMoodleId: number;
      newGrade: number;
      feedback?: string;
    },
    isAdmin: boolean = false,
  ) {
    // Check if edit session is active
    const activeSession = await this.getActiveSession();
    if (!activeSession) {
      throw new ForbiddenException(
        'La edición de notas no está habilitada. Contacte al administrador.',
      );
    }

    // Verify course access (unless Admin)
    if (!isAdmin) {
      const isTeacher = await this.courseTeacherRepository.findOne({
        where: {
          teacherId: teacherUserId,
          courseMoodleId: data.courseMoodleId,
        },
      });

      if (!isTeacher) {
        throw new ForbiddenException(
          'No estás asignado como profesor de este curso.',
        );
      }
    }

    // Check if this grade was already edited in this session
    const existingEdit = await this.gradeEditRepository.findOne({
      where: {
        sessionId: activeSession.id,
        courseMoodleId: data.courseMoodleId,
        itemMoodleId: data.itemMoodleId,
        studentMoodleId: data.studentMoodleId,
      },
    });

    if (existingEdit) {
      throw new ConflictException(
        'Esta nota ya fue editada en la sesión actual. No se puede modificar hasta que el administrador habilite una nueva sesión.',
      );
    }

    // Get the current Moodle grade
    const currentMoodleGrade = await this.moodleGradeRepository.findOne({
      where: {
        courseMoodleId: data.courseMoodleId,
        itemMoodleId: data.itemMoodleId,
        userMoodleId: data.studentMoodleId,
      },
    });

    // Save the edit
    const gradeEdit = new GradeEdit();
    gradeEdit.sessionId = activeSession.id;
    gradeEdit.teacherUserId = teacherUserId;
    gradeEdit.courseMoodleId = data.courseMoodleId;
    gradeEdit.itemMoodleId = data.itemMoodleId;
    gradeEdit.studentMoodleId = data.studentMoodleId;
    gradeEdit.previousGrade = currentMoodleGrade
      ? Number(currentMoodleGrade.grade)
      : null;
    gradeEdit.newGrade = data.newGrade;
    gradeEdit.feedback = data.feedback || null;

    const saved = await this.gradeEditRepository.save(gradeEdit);

    return {
      success: true,
      gradeEdit: saved,
      message: 'Nota guardada exitosamente',
    };
  }

  /**
   * Revert/Delete a grade edit (teacher)
   */
  async deleteGradeEdit(
    editId: number,
    teacherUserId: number,
    isAdmin: boolean = false,
  ) {
    const activeSession = await this.getActiveSession();
    if (!activeSession) {
      throw new ForbiddenException('La edición de notas no está habilitada.');
    }

    const edit = await this.gradeEditRepository.findOne({
      where: { id: editId, sessionId: activeSession.id },
    });

    if (!edit) {
      throw new BadRequestException(
        'La edición no existe o no pertenece a la sesión activa.',
      );
    }

    // Verify ownership or admin
    if (!isAdmin && edit.teacherUserId !== teacherUserId) {
      throw new ForbiddenException(
        'Solo puedes revertir calificaciones que tú hayas editado.',
      );
    }

    await this.gradeEditRepository.remove(edit);

    return { success: true, message: 'Edición revertida correctamente' };
  }

  /**
   * Get editable grades for a course (teacher view)
   * Same as getGradesByCourse but includes editable status per grade
   * A grade is NOT editable if it was already edited by ANY teacher in the current session
   */
  async getEditableGrades(
    courseMoodleId: number,
    teacherUserId: number,
    isAdmin: boolean = false,
  ) {
    const result = await this.getGradesByCourse(courseMoodleId);
    const activeSession = await this.getActiveSession();

    // If no active session, nothing is editable
    if (!activeSession) {
      result.participants = result.participants.map((p) => ({
        ...p,
        grades: p.grades.map((g) => ({ ...g, editable: false })),
      }));
      return result;
    }

    // Admins can always edit all grades
    if (isAdmin) {
      result.participants = result.participants.map((p) => ({
        ...p,
        grades: p.grades.map((g) => ({ ...g, editable: true })),
      }));
      return result;
    }

    // Get ALL edits for this course in this session (by ANY teacher)
    const allEditsInSession = await this.gradeEditRepository.find({
      where: {
        sessionId: activeSession.id,
        courseMoodleId,
      },
    });

    // Mark each grade as editable or not
    // A grade is NOT editable if ANY teacher already edited it in this session
    result.participants = result.participants.map((p) => ({
      ...p,
      grades: p.grades.map((g) => {
        const wasEditedByAnyTeacher = allEditsInSession.some(
          (e) =>
            Number(e.itemMoodleId) === g.itemMoodleId &&
            Number(e.studentMoodleId) === p.studentMoodleId,
        );
        return {
          ...g,
          editable: !wasEditedByAnyTeacher,
        };
      }),
    }));

    return result;
  }
}
