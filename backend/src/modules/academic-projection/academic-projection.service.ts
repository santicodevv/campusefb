import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In } from 'typeorm';
import { AcademicProgram } from './entities/academic-program.entity';
import { StudyPlan } from './entities/study-plan.entity';
import { StudentProgram } from './entities/student-program.entity';
import { MoodleCourse } from '../moodle-integration/entities/moodle-course.entity';
import { MoodleUser } from '../moodle-integration/entities/moodle-user.entity';
import { MoodleCategory } from '../moodle-integration/entities/moodle-category.entity';
import { MoodleGrade } from '../moodle-integration/entities/moodle-grade.entity';
import { MoodleGradeItem } from '../moodle-integration/entities/moodle-grade-item.entity';
import { MoodleEnrolment } from '../moodle-integration/entities/moodle-enrolment.entity';
import { CourseStudentGrade } from '../academic/entities/course-student-grade.entity';
import { User } from '../users/entities/user.entity';
import { MoodleClientService } from '../moodle-integration/moodle-client.service';
import { CreateAcademicProgramDto } from './dto/create-academic-program.dto';
import { UpdateAcademicProgramDto } from './dto/update-academic-program.dto';
import { CreateStudyPlanDto } from './dto/create-study-plan.dto';
import { CreateProgramCourseDto } from './dto/create-program-course.dto';
import { AssignStudentProgramDto } from './dto/assign-student-program.dto';

@Injectable()
export class ProjectionService {
  constructor(
    @InjectRepository(AcademicProgram)
    private readonly programRepository: Repository<AcademicProgram>,
    @InjectRepository(StudyPlan)
    private readonly studyPlanRepository: Repository<StudyPlan>,
    @InjectRepository(StudentProgram)
    private readonly studentProgramRepository: Repository<StudentProgram>,
    @InjectRepository(MoodleCourse)
    private readonly courseRepository: Repository<MoodleCourse>,
    @InjectRepository(MoodleUser)
    private readonly moodleUserRepository: Repository<MoodleUser>,
    @InjectRepository(MoodleCategory)
    private readonly moodleCategoryRepository: Repository<MoodleCategory>,
    @InjectRepository(MoodleGrade)
    private readonly moodleGradeRepository: Repository<MoodleGrade>,
    @InjectRepository(MoodleGradeItem)
    private readonly moodleGradeItemRepository: Repository<MoodleGradeItem>,
    @InjectRepository(MoodleEnrolment)
    private readonly moodleEnrolmentRepository: Repository<MoodleEnrolment>,
    @InjectRepository(CourseStudentGrade)
    private readonly courseStudentGradeRepository: Repository<CourseStudentGrade>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly moodleClient: MoodleClientService,
  ) {}

  // ========== PROGRAMS CRUD ==========

  async createProgram(dto: CreateAcademicProgramDto): Promise<AcademicProgram> {
    const existing = await this.programRepository.findOne({
      where: { code: dto.code },
    });
    if (existing)
      throw new ConflictException(
        `Program with code ${dto.code} already exists`,
      );
    const program = this.programRepository.create(dto);
    return this.programRepository.save(program);
  }

  async findAllPrograms(): Promise<AcademicProgram[]> {
    return this.programRepository.find({ order: { name: 'ASC' } });
  }

  async findProgramById(id: number): Promise<AcademicProgram> {
    const program = await this.programRepository.findOne({ where: { id } });
    if (!program)
      throw new NotFoundException(`Program with ID ${id} not found`);
    return program;
  }

  async updateProgram(
    id: number,
    dto: UpdateAcademicProgramDto,
  ): Promise<AcademicProgram> {
    const program = await this.findProgramById(id);
    Object.assign(program, dto);
    return this.programRepository.save(program);
  }

  async deleteProgram(id: number): Promise<void> {
    const program = await this.findProgramById(id);
    await this.studyPlanRepository.delete({ programId: id });
    await this.studentProgramRepository.delete({ programId: id });
    await this.programRepository.remove(program);
  }

  // ========== STUDY PLANS ==========

  async addStudyPlan(
    programId: number,
    dto: CreateStudyPlanDto,
  ): Promise<StudyPlan> {
    await this.findProgramById(programId);
    const existing = await this.studyPlanRepository.findOne({
      where: { programId, courseMoodleId: dto.courseMoodleId },
    });
    if (existing)
      throw new ConflictException('This course is already in the study plan');
    const plan = this.studyPlanRepository.create({ ...dto, programId });
    return this.studyPlanRepository.save(plan);
  }

  async getStudyPlansByProgram(programId: number): Promise<any[]> {
    await this.findProgramById(programId);
    const plans = await this.studyPlanRepository.find({
      where: { programId },
      order: { level: 'ASC' },
    });
    const moodleIds = plans.map((p) => p.courseMoodleId);
    const courses =
      moodleIds.length > 0
        ? await this.courseRepository.find({
            where: moodleIds.map((id) => ({ moodleId: id })),
          })
        : [];
    const courseMap = new Map(courses.map((c) => [String(c.moodleId), c]));
    return plans.map((plan) => ({
      ...plan,
      courseName:
        courseMap.get(String(plan.courseMoodleId))?.fullname ||
        courseMap.get(String(plan.courseMoodleId))?.subjectName ||
        'Unknown',
    }));
  }

  /**
   * Obtiene los cursos de una categoría (subprograma) como plan de estudio.
   * Busca todos los cursos que pertenecen a la categoría y sus subcategorías.
   */
  async getStudyPlansByCategory(
    categoryMoodleId: number,
  ): Promise<{ materias: any[] }> {
    // Verificar que la categoría existe
    const category = await this.moodleCategoryRepository.findOne({
      where: { moodleId: categoryMoodleId },
    });
    if (!category) {
      throw new NotFoundException(
        `Category with moodleId ${categoryMoodleId} not found`,
      );
    }

    // Agrupar los cursos directos de cada materia del subprograma.
    const allCategories = await this.moodleCategoryRepository.find();
    const materias = allCategories
      .filter(
        (cat) => Number(cat.parent) === categoryMoodleId && cat.depth === 3,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    const categoryIds = materias.map((materia) => Number(materia.moodleId));
    const courses =
      categoryIds.length > 0
        ? await this.courseRepository.find({
            where: categoryIds.map((categoryId) => ({ categoryId })),
            order: { fullname: 'ASC' },
          })
        : [];
    const coursesByCategory = new Map<number, typeof courses>();
    for (const course of courses) {
      const categoryId = Number(course.categoryId);
      const categoryCourses = coursesByCategory.get(categoryId) ?? [];
      categoryCourses.push(course);
      coursesByCategory.set(categoryId, categoryCourses);
    }

    return {
      materias: materias.map((materia) => ({
        id: materia.id,
        moodleId: Number(materia.moodleId),
        name: materia.name,
        cursos: (coursesByCategory.get(Number(materia.moodleId)) ?? []).map(
          (course) => ({
            id: course.id,
            courseMoodleId: Number(course.moodleId),
            courseName:
              course.subjectName ||
              course.fullname ||
              `Curso ${course.moodleId}`,
            level: 1,
          }),
        ),
      })),
    };
  }

  async getMateriasBySubprogram(subprogramMoodleId: number): Promise<any[]> {
    const subprogram = await this.moodleCategoryRepository.findOne({
      where: { moodleId: subprogramMoodleId },
    });
    if (!subprogram) {
      throw new NotFoundException(
        `Subprograma ${subprogramMoodleId} no encontrado`,
      );
    }

    return (
      await this.moodleCategoryRepository.find({
        where: { parent: subprogramMoodleId, depth: 3 },
        order: { name: 'ASC' },
      })
    ).map((materia) => ({
      id: materia.id,
      moodleId: Number(materia.moodleId),
      name: materia.name,
      parent: Number(materia.parent),
      depth: materia.depth,
      coursecount: materia.coursecount,
    }));
  }

  /**
   * Obtiene los programas que ya tienen asignado este curso en su plan de estudio.
   */
  async getProgramsByCourse(
    courseMoodleId: number,
  ): Promise<AcademicProgram[]> {
    const plans = await this.studyPlanRepository.find({
      where: { courseMoodleId },
    });
    if (plans.length === 0) return [];
    const programIds = [...new Set(plans.map((p) => p.programId))];
    return this.programRepository.find({
      where: programIds.map((id) => ({ id })),
      order: { name: 'ASC' },
    });
  }

  async updateStudyPlan(
    id: number,
    dto: Partial<CreateStudyPlanDto>,
  ): Promise<StudyPlan> {
    const plan = await this.studyPlanRepository.findOne({ where: { id } });
    if (!plan)
      throw new NotFoundException(`Study plan entry with ID ${id} not found`);
    Object.assign(plan, dto);
    return this.studyPlanRepository.save(plan);
  }

  async removeStudyPlan(id: number): Promise<void> {
    const plan = await this.studyPlanRepository.findOne({ where: { id } });
    if (!plan)
      throw new NotFoundException(`Study plan entry with ID ${id} not found`);
    await this.studyPlanRepository.remove(plan);
  }

  /**
   * Crea un curso nuevo en Moodle usando la categoría del programa y lo
   * agrega al plan de estudio del programa en un solo paso.
   */
  async createCourseForProgram(
    programId: number,
    dto: CreateProgramCourseDto,
  ): Promise<any> {
    const program = await this.findProgramById(programId);

    if (program.moodleCategoryId == null) {
      throw new BadRequestException(
        `El programa "${program.name}" no está vinculado a una categoría de Moodle. Sincroniza las categorías primero.`,
      );
    }

    let categoryId = Number(program.moodleCategoryId);

    let category = await this.moodleCategoryRepository.findOne({
      where: { moodleId: categoryId },
    });
    if (!category) {
      throw new BadRequestException(
        `La categoría de Moodle ${categoryId} no existe. Sincroniza las categorías primero.`,
      );
    }

    if (dto.materiaMoodleId != null) {
      const materia = await this.moodleCategoryRepository.findOne({
        where: { moodleId: dto.materiaMoodleId },
      });
      if (!materia || materia.depth !== 3) {
        throw new BadRequestException(
          'La materia seleccionada no existe o no es válida.',
        );
      }

      const categories = await this.moodleCategoryRepository.find();
      let parentId = Number(materia.parent);
      let belongsToProgram = false;
      while (parentId) {
        if (parentId === Number(program.moodleCategoryId)) {
          belongsToProgram = true;
          break;
        }
        const parent = categories.find(
          (candidate) => Number(candidate.moodleId) === parentId,
        );
        parentId = parent ? Number(parent.parent) : 0;
      }
      if (!belongsToProgram) {
        throw new BadRequestException(
          'La materia seleccionada no pertenece al programa.',
        );
      }

      categoryId = Number(materia.moodleId);
      category = materia;
    }

    const moodlePayload = {
      fullname: dto.fullname,
      shortname: dto.shortname,
      categoryid: categoryId,
      idnumber: dto.idnumber,
      summary: dto.summary,
      visible: dto.visible === false ? 0 : 1,
      startdate: dto.startdate
        ? Math.floor(new Date(dto.startdate).getTime() / 1000)
        : undefined,
      enddate: dto.enddate
        ? Math.floor(new Date(dto.enddate).getTime() / 1000)
        : undefined,
    };

    let moodleResult;
    try {
      moodleResult = await this.moodleClient.createCourse(moodlePayload);
    } catch (error) {
      throw new BadRequestException(
        `Error al crear el curso en Moodle: ${error.message}`,
      );
    }

    if (!moodleResult || moodleResult.length === 0) {
      throw new BadRequestException(
        'Error al crear el curso en Moodle: respuesta vacía',
      );
    }

    const createdMoodleCourse = moodleResult[0];

    const course = this.courseRepository.create({
      moodleId: createdMoodleCourse.id,
      shortname: dto.shortname,
      fullname: dto.fullname,
      categoryId,
      visible: dto.visible !== false,
      lastSyncedAt: new Date(),
    });

    if (dto.idnumber) course.idnumber = dto.idnumber;
    if (dto.summary) course.summary = dto.summary;
    if (dto.startdate) course.startdate = new Date(dto.startdate);
    if (dto.enddate) course.enddate = new Date(dto.enddate);
    if (dto.subjectName) course.subjectName = dto.subjectName;
    if (dto.code) course.code = dto.code;

    await this.courseRepository.save(course);

    const existing = await this.studyPlanRepository.findOne({
      where: { programId, courseMoodleId: course.moodleId },
    });
    if (!existing) {
      await this.studyPlanRepository.save(
        this.studyPlanRepository.create({
          programId,
          courseMoodleId: course.moodleId,
          level: dto.level,
        }),
      );
    }

    return {
      course: { ...course, studentCount: 0, teacherCount: 0 },
    };
  }

  /**
   * Asigna automáticamente a cada programa los cursos de Moodle que ya
   * pertenecen a su categoría (MoodleCourse.categoryId === Program.moodleCategoryId)
   * y aún no están en el plan de estudio. El nivel por defecto es 1.
   */
  async autoAssignCoursesToPrograms(): Promise<{
    programsProcessed: number;
    coursesAssigned: number;
    coursesSkipped: number;
  }> {
    const programs = await this.programRepository.find({
      where: { moodleCategoryId: Not(IsNull()) },
    });

    let programsProcessed = 0;
    let coursesAssigned = 0;
    let coursesSkipped = 0;

    for (const program of programs) {
      const moodleCategoryId = Number(program.moodleCategoryId);
      const courses = await this.courseRepository.find({
        where: { categoryId: moodleCategoryId },
      });

      if (courses.length === 0) continue;

      programsProcessed++;

      const existingPlans = await this.studyPlanRepository.find({
        where: { programId: program.id },
      });
      const existingCourseIds = new Set(
        existingPlans.map((p) => String(p.courseMoodleId)),
      );

      for (const course of courses) {
        const courseKey = String(course.moodleId);
        if (existingCourseIds.has(courseKey)) {
          coursesSkipped++;
          continue;
        }
        await this.studyPlanRepository.save(
          this.studyPlanRepository.create({
            programId: program.id,
            courseMoodleId: course.moodleId,
            level: 1,
          }),
        );
        coursesAssigned++;
      }
    }

    return { programsProcessed, coursesAssigned, coursesSkipped };
  }

  // ========== STUDENT PROGRAM ==========

  async assignStudentToProgram(
    dto: AssignStudentProgramDto,
  ): Promise<StudentProgram> {
    await this.findProgramById(dto.programId);
    const existing = await this.studentProgramRepository.findOne({
      where: { userId: dto.userId, programId: dto.programId },
    });
    if (existing)
      throw new ConflictException(
        'Student is already assigned to this program',
      );
    const sp = this.studentProgramRepository.create(dto);
    return this.studentProgramRepository.save(sp);
  }

  async getStudentPrograms(userId: number): Promise<StudentProgram[]> {
    return this.studentProgramRepository.find({
      where: { userId },
      relations: ['program'],
    });
  }

  async getStudentsByProgram(programId: number): Promise<any[]> {
    await this.findProgramById(programId);
    return this.studentProgramRepository.find({
      where: { programId },
      order: { createdAt: 'DESC' },
    });
  }

  async removeStudentFromProgram(id: number): Promise<void> {
    const sp = await this.studentProgramRepository.findOne({ where: { id } });
    if (!sp)
      throw new NotFoundException(
        `Student program assignment with ID ${id} not found`,
      );
    await this.studentProgramRepository.remove(sp);
  }

  async toggleStudentProgram(
    dto: AssignStudentProgramDto,
  ): Promise<{ assigned: boolean; studentProgram?: StudentProgram }> {
    await this.findProgramById(dto.programId);
    const existing = await this.studentProgramRepository.findOne({
      where: { userId: dto.userId, programId: dto.programId },
    });

    if (existing) {
      await this.studentProgramRepository.remove(existing);
      return { assigned: false };
    }

    const sp = this.studentProgramRepository.create({
      userId: dto.userId,
      programId: dto.programId,
      entryDate: dto.entryDate ?? new Date().toISOString().slice(0, 10),
    });
    const saved = await this.studentProgramRepository.save(sp);
    return { assigned: true, studentProgram: saved };
  }

  async findStudentsPaginated(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{
    students: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const qb = this.moodleUserRepository
      .createQueryBuilder('mu')
      .where(
        `EXISTS (SELECT 1 FROM moodle_enrolments me WHERE me.user_moodle_id = mu.moodle_id AND me.role_code = 'student')`,
      );

    if (search && search.trim()) {
      qb.andWhere(
        '(mu.firstname ILIKE :search OR mu.lastname ILIKE :search OR mu.email ILIKE :search OR mu.username ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    qb.orderBy('mu.suspended', 'ASC')
      .addOrderBy('mu.firstname', 'ASC')
      .addOrderBy('mu.lastname', 'ASC');

    const total = await qb.getCount();
    const users = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const students = users.map((u) => ({
      moodleId: Number(u.moodleId),
      studentName:
        [u.firstname, u.lastname].filter(Boolean).join(' ').trim() ||
        u.email ||
        `User ${u.moodleId}`,
      username: u.username,
      matriculation: u.username && /^\d+$/.test(u.username) ? u.username : null,
      email: u.email,
      suspended: u.suspended,
      programIds: [] as number[],
    }));

    if (students.length > 0) {
      const assignments = await this.studentProgramRepository.find({
        where: { userId: In(students.map((s) => s.moodleId)) },
      });
      const byUser = new Map<number, number[]>();
      for (const a of assignments) {
        const key = Number(a.userId);
        if (!byUser.has(key)) byUser.set(key, []);
        byUser.get(key)!.push(Number(a.programId));
      }
      for (const s of students) {
        s.programIds = byUser.get(s.moodleId) ?? [];
      }
    }

    return { students, total, page, limit };
  }

  // ========== PROJECTION LOGIC ==========

  async getPendingSubjects(programId?: number): Promise<any[]> {
    const query = this.studentProgramRepository
      .createQueryBuilder('sp')
      .select('sp.user_id', 'studentId')
      .addSelect('sp.program_id', 'programId')
      .addSelect('pe.course_moodle_id', 'courseMoodleId')
      .addSelect('pe.level', 'level')
      .addSelect(
        'MAX(CASE WHEN mg.grade >= 70 THEN 1 ELSE 0 END)',
        'hasApproved',
      )
      .addSelect(
        'MAX(CASE WHEN mg.grade IS NOT NULL THEN 1 ELSE 0 END)',
        'hasAnyGrade',
      )
      .innerJoin('sga_study_plans', 'pe', 'pe.program_id = sp.program_id')
      .leftJoin(
        'moodle_grades',
        'mg',
        'mg.user_moodle_id = sp.user_id AND mg.course_moodle_id = pe.course_moodle_id',
      )
      .groupBy('sp.user_id, sp.program_id, pe.course_moodle_id, pe.level');

    if (programId) {
      query.where('sp.program_id = :programId', { programId });
    }

    const results = await query.getRawMany();
    return results.map((r) => {
      const hasApproved = Number(r.hasApproved) === 1;
      const hasAnyGrade = Number(r.hasAnyGrade) === 1;
      let status: 'approved' | 'failed' | 'pending';
      if (hasApproved) {
        status = 'approved';
      } else if (hasAnyGrade) {
        status = 'failed';
      } else {
        status = 'pending';
      }
      return {
        studentId: Number(r.studentId),
        courseMoodleId: Number(r.courseMoodleId),
        level: Number(r.level),
        status,
      };
    });
  }

  async getDemandBySubject(programId?: number): Promise<any[]> {
    const pending = await this.getPendingSubjects(programId);
    const grouped = new Map<
      number,
      { pendingCount: number; failedCount: number; courseName: string }
    >();

    const courseIds = [...new Set(pending.map((p) => p.courseMoodleId))];
    const courses =
      courseIds.length > 0
        ? await this.courseRepository.find({
            where: courseIds.map((id) => ({ moodleId: id })),
          })
        : [];
    const courseMap = new Map(courses.map((c) => [String(c.moodleId), c]));

    for (const p of pending) {
      if (p.status === 'approved') continue;
      if (!grouped.has(p.courseMoodleId)) {
        grouped.set(p.courseMoodleId, {
          pendingCount: 0,
          failedCount: 0,
          courseName:
            courseMap.get(String(p.courseMoodleId))?.fullname ||
            courseMap.get(String(p.courseMoodleId))?.subjectName ||
            `Course ${p.courseMoodleId}`,
        });
      }
      const entry = grouped.get(p.courseMoodleId)!;
      if (p.status === 'pending') entry.pendingCount++;
      else entry.failedCount++;
    }

    return Array.from(grouped.entries())
      .map(([courseMoodleId, data]) => ({
        courseMoodleId,
        courseName: data.courseName,
        pendingCount: data.pendingCount,
        failedCount: data.failedCount,
        totalDemand: data.pendingCount + data.failedCount,
        studentsPerSection: 25,
        sectionsNeeded: Math.ceil(data.pendingCount / 25),
      }))
      .sort((a, b) => b.pendingCount - a.pendingCount);
  }

  /**
   * Dado un categoryMoodleId (de una subcategoría como DIPLOMATURA),
   * encuentra el program_id correspondiente en sga_programs.
   * La lógica es: subcategoría.parent -> categoría raíz.moodleId -> program.moodleCategoryId
   */
  private async findProgramIdFromCategory(
    categoryMoodleId: number,
  ): Promise<number | undefined> {
    // Primero obtener la categoría para ver su parent
    const category = await this.moodleCategoryRepository.findOne({
      where: { moodleId: categoryMoodleId },
    });

    if (!category) return undefined;

    // Si es una categoría raíz (parent=0), buscar directamente
    const parentMoodleId = Number(category.parent);
    const searchMoodleId =
      parentMoodleId === 0 ? categoryMoodleId : parentMoodleId;

    // Buscar el programa con ese moodleCategoryId
    const program = await this.programRepository.findOne({
      where: { moodleCategoryId: searchMoodleId },
    });

    return program?.id;
  }

  async getDemandByLevel(
    programId?: number,
    categoryMoodleId?: number,
  ): Promise<any[]> {
    let effectiveProgramId = programId;

    if (!effectiveProgramId && categoryMoodleId) {
      effectiveProgramId =
        await this.findProgramIdFromCategory(categoryMoodleId);
    }

    const pending = await this.getPendingSubjects(effectiveProgramId);
    const grouped = new Map<number, Set<number>>();

    for (const p of pending) {
      if (p.status === 'approved') continue;
      if (!grouped.has(p.level)) grouped.set(p.level, new Set());
      grouped.get(p.level)!.add(p.studentId);
    }

    return Array.from(grouped.entries())
      .map(([level, students]) => ({
        level,
        studentCount: students.size,
      }))
      .sort((a, b) => a.level - b.level);
  }

  async getSectionProjection(
    programId?: number,
    categoryMoodleId?: number,
    maxStudentsPerSection: number = 25,
  ): Promise<any[]> {
    let effectiveProgramId = programId;

    if (!effectiveProgramId && categoryMoodleId) {
      effectiveProgramId =
        await this.findProgramIdFromCategory(categoryMoodleId);
    }

    const demand = await this.getDemandBySubject(effectiveProgramId);
    return demand.map((d) => ({
      courseMoodleId: d.courseMoodleId,
      courseName: d.courseName,
      pendingCount: d.pendingCount,
      sectionsNeeded: Math.ceil(d.pendingCount / maxStudentsPerSection),
    }));
  }

  async getProjectionMatrix(
    programId?: number,
    categoryMoodleId?: number,
  ): Promise<any[]> {
    let effectiveProgramId = programId;

    if (!effectiveProgramId && categoryMoodleId) {
      effectiveProgramId =
        await this.findProgramIdFromCategory(categoryMoodleId);
    }

    const pending = await this.getPendingSubjects(effectiveProgramId);
    const students = new Map<number, any>();
    const courseIds = [...new Set(pending.map((p) => p.courseMoodleId))];
    const courses =
      courseIds.length > 0
        ? await this.courseRepository.find({
            where: courseIds.map((id) => ({ moodleId: id })),
          })
        : [];
    const courseMap = new Map(courses.map((c) => [String(c.moodleId), c]));

    for (const p of pending) {
      if (!students.has(p.studentId)) {
        students.set(p.studentId, {
          studentId: p.studentId,
          courses: [],
        });
      }
      students.get(p.studentId)!.courses.push({
        courseMoodleId: p.courseMoodleId,
        courseName:
          courseMap.get(String(p.courseMoodleId))?.fullname ||
          courseMap.get(String(p.courseMoodleId))?.subjectName ||
          `Course ${p.courseMoodleId}`,
        status: p.status === 'approved' ? 'approved' : 'pending',
      });
    }

    const rows = Array.from(students.values());

    const studentIds = rows.map((r) => r.studentId);
    const users =
      studentIds.length > 0
        ? await this.moodleUserRepository.find({
            where: studentIds.map((id) => ({ moodleId: id })),
          })
        : [];
    const userMap = new Map(users.map((u) => [Number(u.moodleId), u]));

    return rows.map((row) => {
      const moodleUser = userMap.get(row.studentId);
      const studentName = moodleUser
        ? [moodleUser.firstname, moodleUser.lastname]
            .filter(Boolean)
            .join(' ')
            .trim() || moodleUser.email
        : undefined;
      return { ...row, studentName };
    });
  }

  // ========== CATEGORY HIERARCHY ==========

  /**
   * Obtiene la estructura jerárquica completa de categorías de Moodle.
   * Retorna un árbol donde:
   * - Nivel 0 (parent=0): Programas (Tecnicatura, Diplomatura, etc.)
   * - Nivel 1: Cursos dentro del programa
   * - Nivel 2: Materias dentro del curso
   */
  async getCategoryHierarchy(): Promise<any[]> {
    const allCategories = await this.moodleCategoryRepository.find({
      order: { parent: 'ASC', name: 'ASC' },
    });

    // También obtenemos los cursos para mostrar cuántos hay en cada categoría
    const courses = await this.courseRepository.find();
    const coursesByCategory = new Map<number, typeof courses>();
    for (const course of courses) {
      const catId = Number(course.categoryId);
      if (!coursesByCategory.has(catId)) {
        coursesByCategory.set(catId, []);
      }
      coursesByCategory.get(catId)!.push(course);
    }

    // Construir el mapa de categorías
    const categoryMap = new Map<number, any>();
    for (const cat of allCategories) {
      categoryMap.set(Number(cat.moodleId), {
        id: cat.id,
        moodleId: Number(cat.moodleId),
        name: cat.name,
        parent: Number(cat.parent),
        depth: cat.depth,
        coursecount: cat.coursecount,
        visible: cat.visible,
        courses: coursesByCategory.get(Number(cat.moodleId)) || [],
        children: [],
      });
    }

    // Construir el árbol
    const rootCategories: any[] = [];
    for (const cat of categoryMap.values()) {
      if (cat.parent === 0) {
        rootCategories.push(cat);
      } else {
        const parentCat = categoryMap.get(cat.parent);
        if (parentCat) {
          parentCat.children.push(cat);
        }
      }
    }

    return rootCategories;
  }

  /**
   * Obtiene los subprogramas (categorías de depth=2) para usar en selectores.
   * Estos son: DIPLOMATURA, TECNICATURA, LICENCIATURA MINISTERIO, LICENCIATURA TEOLOGIA
   * que son hijos de los programas raíz como FORMACIÓN BÍBLICA.
   */
  async getSubprograms(): Promise<any[]> {
    const subprograms = await this.moodleCategoryRepository.find({
      where: { depth: 2 },
      order: { name: 'ASC' },
    });

    return subprograms.map((cat) => ({
      id: cat.id,
      moodleId: Number(cat.moodleId),
      code: cat.name.substring(0, 4).toUpperCase(),
      name: cat.name,
      parent: Number(cat.parent),
      coursecount: cat.coursecount,
    }));
  }

  /**
   * Elimina los programas que fueron creados incorrectamente desde
   * categorías de nivel materia o inferior (depth >= 3).
   * Solo elimina programas sin asignaciones de estudiantes.
   */
  async cleanupInvalidPrograms(): Promise<{
    deleted: number;
    skipped: number;
    details: { id: number; name: string; reason: string }[];
  }> {
    // Los subprogramas (depth=2) son válidos y deben conservarse.
    const nonRootCategories = await this.moodleCategoryRepository.find({
      where: { depth: Not(1) },
    });

    // Obtener programas vinculados a categorías que no son raíz
    const allPrograms = await this.programRepository.find();
    const invalidPrograms = allPrograms.filter((p) => {
      if (!p.moodleCategoryId) return false;
      const category = nonRootCategories.find(
        (candidate) =>
          Number(candidate.moodleId) === Number(p.moodleCategoryId),
      );
      return category != null && Number(category.depth) >= 3;
    });

    let deleted = 0;
    let skipped = 0;
    const details: { id: number; name: string; reason: string }[] = [];

    for (const program of invalidPrograms) {
      // Verificar si tiene estudiantes asignados
      const studentCount = await this.studentProgramRepository.count({
        where: { programId: program.id },
      });

      // Verificar si tiene plan de estudio
      const studyPlanCount = await this.studyPlanRepository.count({
        where: { programId: program.id },
      });

      if (studentCount > 0) {
        skipped++;
        details.push({
          id: program.id,
          name: program.name,
          reason: `Tiene ${studentCount} estudiantes asignados`,
        });
        continue;
      }

      if (studyPlanCount > 0) {
        // Eliminar el plan de estudio primero
        await this.studyPlanRepository.delete({ programId: program.id });
      }

      await this.programRepository.remove(program);
      deleted++;
      details.push({
        id: program.id,
        name: program.name,
        reason: 'Eliminado',
      });
    }

    return { deleted, skipped, details };
  }

  // ========== STUDENT GRADES BY PROGRAM ==========

  /**
   * Obtiene estudiantes matriculados en cursos del programa/categoría con sus notas totales.
   * Solo devuelve registros donde el estudiante tiene una nota asignada.
   * Acepta programId (de sga_programs) o categoryMoodleId (de moodle_categories) para filtrar.
   */
  async getStudentGradesByProgram(
    programId?: number,
    categoryMoodleId?: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: {
      studentMoodleId: number;
      studentName: string;
      courseMoodleId: number;
      courseName: string;
      grade: number;
    }[];
    total: number;
    page: number;
    limit: number;
  }> {
    let categoryId: number;

    if (categoryMoodleId) {
      // Usar categoryMoodleId directamente (para filtrar por subprograma)
      categoryId = categoryMoodleId;
    } else if (programId) {
      // Usar programId para obtener la categoría del programa
      const program = await this.findProgramById(programId);
      if (!program.moodleCategoryId) {
        return { data: [], total: 0, page, limit };
      }
      categoryId = Number(program.moodleCategoryId);
    } else {
      return { data: [], total: 0, page, limit };
    }

    // Obtener todas las categorías hijas (para incluir cursos en subcategorías)
    const allCategories = await this.moodleCategoryRepository.find();
    const childCategoryIds = this.getChildCategoryIds(
      categoryId,
      allCategories,
    );
    const allCategoryIds = [categoryId, ...childCategoryIds];

    // Obtener todos los cursos del programa (incluyendo subcategorías)
    const courses = await this.courseRepository.find({
      where: allCategoryIds.map((catId) => ({ categoryId: catId })),
    });

    if (courses.length === 0) {
      return { data: [], total: 0, page, limit };
    }

    const courseMoodleIds = courses.map((c) => Number(c.moodleId));
    const courseMap = new Map(courses.map((c) => [Number(c.moodleId), c]));

    // Obtener los grade items de tipo "course" (nota total) para estos cursos
    const courseGradeItems = await this.moodleGradeItemRepository.find({
      where: courseMoodleIds.map((id) => ({
        courseMoodleId: id,
        itemtype: 'course',
      })),
    });

    if (courseGradeItems.length === 0) {
      return { data: [], total: 0, page, limit };
    }

    // Crear mapa de courseMoodleId -> itemMoodleId (para la nota total)
    const courseToItemMap = new Map<number, number>();
    for (const item of courseGradeItems) {
      courseToItemMap.set(
        Number(item.courseMoodleId),
        Number(item.itemMoodleId),
      );
    }

    const itemMoodleIds = courseGradeItems.map((gi) => Number(gi.itemMoodleId));

    // Contar total de registros (estudiantes con notas en estos cursos)
    const countQuery = this.moodleGradeRepository
      .createQueryBuilder('g')
      .where('g.courseMoodleId IN (:...courseIds)', {
        courseIds: courseMoodleIds,
      })
      .andWhere('g.itemMoodleId IN (:...itemIds)', { itemIds: itemMoodleIds })
      .andWhere('g.grade IS NOT NULL');

    const total = await countQuery.getCount();

    // Obtener registros paginados
    const grades = await this.moodleGradeRepository
      .createQueryBuilder('g')
      .where('g.courseMoodleId IN (:...courseIds)', {
        courseIds: courseMoodleIds,
      })
      .andWhere('g.itemMoodleId IN (:...itemIds)', { itemIds: itemMoodleIds })
      .andWhere('g.grade IS NOT NULL')
      .orderBy('g.courseMoodleId', 'ASC')
      .addOrderBy('g.userMoodleId', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    if (grades.length === 0) {
      return { data: [], total: 0, page, limit };
    }

    // Obtener info de estudiantes
    const studentMoodleIds = [
      ...new Set(grades.map((g) => Number(g.userMoodleId))),
    ];
    const students = await this.moodleUserRepository.find({
      where: studentMoodleIds.map((id) => ({ moodleId: id })),
    });
    const studentMap = new Map(students.map((s) => [Number(s.moodleId), s]));

    // Construir resultado
    const data = grades.map((g) => {
      const student = studentMap.get(Number(g.userMoodleId));
      const course = courseMap.get(Number(g.courseMoodleId));
      return {
        studentMoodleId: Number(g.userMoodleId),
        studentName: student
          ? [student.firstname, student.lastname]
              .filter(Boolean)
              .join(' ')
              .trim() ||
            student.email ||
            `User ${g.userMoodleId}`
          : `User ${g.userMoodleId}`,
        courseMoodleId: Number(g.courseMoodleId),
        courseName:
          course?.subjectName ||
          course?.fullname ||
          `Curso ${g.courseMoodleId}`,
        grade: Number(g.grade),
      };
    });

    return { data, total, page, limit };
  }

  /**
   * Matriz de notas por curso para un subprograma.
   * - Columnas: todos los cursos del subprograma (categoría y sus hijas),
   *   ordenados por materia y nombre.
   * - Filas: estudiantes con enrolamiento 'student' en alguno de esos cursos,
   *   paginados.
   * - Celdas: nota total del curso (grade item tipo 'course'); null si el
   *   estudiante no tiene nota en ese curso.
   */
  async getStudentGradesMatrix(
    categoryMoodleId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    courses: { id: number; shortname: string | null; name: string }[];
    students: {
      moodleId: number;
      name: string;
      suspended: boolean;
      grades: Record<number, number | null>;
    }[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Cursos del subprograma (incluye materias/subcategorías)
    const allCategories = await this.moodleCategoryRepository.find();
    const childCategoryIds = this.getChildCategoryIds(
      categoryMoodleId,
      allCategories,
    );
    const categoryIds = [categoryMoodleId, ...childCategoryIds];

    const courses = await this.courseRepository.find({
      where: categoryIds.map((catId) => ({ categoryId: catId })),
    });

    if (courses.length === 0) {
      return { courses: [], students: [], total: 0, page, limit };
    }

    // Columnas ordenadas agrupadas por materia y luego por nombre
    const categoryNameById = new Map(
      allCategories.map((c) => [Number(c.moodleId), c.name]),
    );
    const courseColumns = courses
      .map((c) => ({
        id: Number(c.moodleId),
        shortname: c.shortname ? c.shortname.trim() || null : null,
        name: c.subjectName || c.fullname || `Curso ${c.moodleId}`,
        materia: categoryNameById.get(Number(c.categoryId)) ?? '',
        fullname: c.fullname ?? '',
      }))
      .sort(
        (a, b) =>
          a.materia.localeCompare(b.materia) ||
          a.fullname.localeCompare(b.fullname),
      )
      .map(({ id, shortname, name }) => ({ id, shortname, name }));

    const courseMoodleIds = courses.map((c) => Number(c.moodleId));

    // Estudiantes enrolados como 'student' en cualquiera de esos cursos
    const studentsQb = this.moodleUserRepository
      .createQueryBuilder('mu')
      .where(
        `EXISTS (
          SELECT 1 FROM moodle_enrolments me
          WHERE me.user_moodle_id = mu.moodle_id
            AND me.role_code = 'student'
            AND me.course_moodle_id IN (:...courseIds)
        )`,
        { courseIds: courseMoodleIds },
      )
      .orderBy('mu.suspended', 'ASC')
      .addOrderBy('mu.firstname', 'ASC')
      .addOrderBy('mu.lastname', 'ASC');

    const total = await studentsQb.getCount();
    const users = await studentsQb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Notas finales propias: totalGrade de course_student_grades (asignada por el profesor).
    // Se ignora la nota calculada de Moodle. Sin nota manual -> celda vacía.
    const gradeMap = new Map<string, number>();
    const pageMoodleIds = users.map((u) => Number(u.moodleId));

    if (pageMoodleIds.length > 0) {
      const appUsers = await this.userRepository.find({
        where: pageMoodleIds.map((moodleId) => ({ moodleUserId: moodleId })),
      });
      const moodleIdByAppUserId = new Map<number, number>();
      for (const u of appUsers) {
        if (u.moodleUserId != null) {
          moodleIdByAppUserId.set(Number(u.id), Number(u.moodleUserId));
        }
      }

      if (appUsers.length > 0) {
        const grades = await this.courseStudentGradeRepository.find({
          where: {
            studentId: In(appUsers.map((u) => Number(u.id))),
            courseMoodleId: In(courseMoodleIds),
            totalGrade: Not(IsNull()),
          },
          order: { updatedAt: 'DESC' },
        });

        for (const g of grades) {
          const moodleId = moodleIdByAppUserId.get(Number(g.studentId));
          if (!moodleId) continue;
          const key = `${moodleId}:${Number(g.courseMoodleId)}`;
          if (!gradeMap.has(key)) {
            gradeMap.set(key, Number(g.totalGrade));
          }
        }
      }
    }

    const students = users.map((u) => {
      const uid = Number(u.moodleId);
      const grades: Record<number, number | null> = {};
      for (const course of courseColumns) {
        grades[course.id] = gradeMap.get(`${uid}:${course.id}`) ?? null;
      }
      return {
        moodleId: uid,
        name:
          [u.firstname, u.lastname].filter(Boolean).join(' ').trim() ||
          u.email ||
          `User ${u.moodleId}`,
        suspended: u.suspended,
        grades,
      };
    });

    return { courses: courseColumns, students, total, page, limit };
  }

  /**
   * Obtiene recursivamente los IDs de todas las categorías hijas
   */
  private getChildCategoryIds(
    parentId: number,
    allCategories: MoodleCategory[],
  ): number[] {
    const children = allCategories.filter((c) => Number(c.parent) === parentId);
    const childIds = children.map((c) => Number(c.moodleId));
    for (const child of children) {
      childIds.push(
        ...this.getChildCategoryIds(Number(child.moodleId), allCategories),
      );
    }
    return childIds;
  }
}
