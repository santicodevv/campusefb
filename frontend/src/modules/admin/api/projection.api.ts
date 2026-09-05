import { api } from '@/shared/lib';
import type { SuccessResponse } from '@/shared/types';
import type { Course } from '../types/course.types';
import type {
  AcademicProgram,
  StudyPlan,
  StudentProgram,
  DemandBySubject,
  DemandByLevel,
  SectionProjection,
  ProjectionMatrixRow,
  CreateAcademicProgramRequest,
  UpdateAcademicProgramRequest,
  CreateStudyPlanRequest,
  AssignStudentProgramRequest,
  CreateProgramCourseRequest,
  AutoAssignResult,
  PagedProjectionStudents,
  ToggleStudentProgramResult,
  CategoryHierarchyNode,
  PagedStudentGrades,
  StudentGradesMatrix,
  StudyPlanMateria,
  StudyPlansByCategory,
} from '../types/projection.types';

export const projectionApi = {
  async getCategoryHierarchy(): Promise<CategoryHierarchyNode[]> {
    const response = await api.get<CategoryHierarchyNode[]>('/academic-projection/categories/hierarchy');
    return response.data;
  },

  async getSubprograms(): Promise<{ id: number; moodleId: number; code: string; name: string; parent: number; coursecount: number }[]> {
    const response = await api.get<{ id: number; moodleId: number; code: string; name: string; parent: number; coursecount: number }[]>('/academic-projection/subprograms');
    return response.data;
  },

  async getMateriasBySubprogram(subprogramMoodleId: number): Promise<StudyPlanMateria[]> {
    const response = await api.get<StudyPlanMateria[]>(
      `/academic-projection/subprograms/${subprogramMoodleId}/materias`,
    );
    return response.data;
  },

  async getPrograms(): Promise<AcademicProgram[]> {
    const response = await api.get<AcademicProgram[]>('/academic-projection/programs');
    return response.data;
  },

  async cleanupInvalidPrograms(): Promise<{
    deleted: number;
    skipped: number;
    details: { id: number; name: string; reason: string }[];
  }> {
    const response = await api.post<{
      deleted: number;
      skipped: number;
      details: { id: number; name: string; reason: string }[];
    }>('/academic-projection/programs/cleanup-invalid');
    return response.data;
  },

  async getProgramById(id: number): Promise<AcademicProgram> {
    const response = await api.get<AcademicProgram>(`/academic-projection/programs/${id}`);
    return response.data;
  },

  async createProgram(data: CreateAcademicProgramRequest): Promise<AcademicProgram> {
    const response = await api.post<AcademicProgram>('/academic-projection/programs', data);
    return response.data;
  },

  async updateProgram(id: number, data: UpdateAcademicProgramRequest): Promise<AcademicProgram> {
    const response = await api.patch<AcademicProgram>(`/academic-projection/programs/${id}`, data);
    return response.data;
  },

  async deleteProgram(id: number): Promise<SuccessResponse> {
    const response = await api.delete<SuccessResponse>(`/academic-projection/programs/${id}`);
    return response.data;
  },

  async getStudyPlans(categoryMoodleId: number): Promise<StudyPlansByCategory> {
    const response = await api.get<StudyPlansByCategory>(`/academic-projection/categories/${categoryMoodleId}/study-plans`);
    return response.data;
  },

  async addStudyPlan(programId: number, data: CreateStudyPlanRequest): Promise<StudyPlan> {
    const response = await api.post<StudyPlan>(`/academic-projection/programs/${programId}/study-plans`, data);
    return response.data;
  },

  async removeStudyPlan(id: number): Promise<SuccessResponse> {
    const response = await api.delete<SuccessResponse>(`/academic-projection/study-plans/${id}`);
    return response.data;
  },

  async getProgramsByCourse(courseMoodleId: number): Promise<AcademicProgram[]> {
    const response = await api.get<AcademicProgram[]>(
      `/academic-projection/study-plans/by-course/${courseMoodleId}`,
    );
    return response.data;
  },

  async createProgramCourse(programId: number, data: CreateProgramCourseRequest): Promise<{ course: Course }> {
    const response = await api.post<{ course: Course }>(`/academic-projection/programs/${programId}/courses`, data);
    return response.data;
  },

  async autoAssignCoursesToPrograms(): Promise<AutoAssignResult> {
    const response = await api.post<AutoAssignResult>('/academic-projection/study-plans/auto-assign');
    return response.data;
  },

  async assignStudent(data: AssignStudentProgramRequest): Promise<StudentProgram> {
    const response = await api.post<StudentProgram>('/academic-projection/student-program', data);
    return response.data;
  },

  async getStudentPrograms(userId: number): Promise<StudentProgram[]> {
    const response = await api.get<StudentProgram[]>(`/academic-projection/student-program/student/${userId}`);
    return response.data;
  },

  async removeStudentProgram(id: number): Promise<SuccessResponse> {
    const response = await api.delete<SuccessResponse>(`/academic-projection/student-program/${id}`);
    return response.data;
  },

  async getStudents(page: number, limit: number, search?: string): Promise<PagedProjectionStudents> {
    const params = {
      page,
      limit,
      ...(search && search.trim() ? { search: search.trim() } : {}),
    };
    const response = await api.get<PagedProjectionStudents>('/academic-projection/students', { params });
    return response.data;
  },

  async toggleStudentProgram(userId: number, programId: number): Promise<ToggleStudentProgramResult> {
    const response = await api.post<ToggleStudentProgramResult>('/academic-projection/student-program/toggle', {
      userId,
      programId,
    });
    return response.data;
  },

  async getDemandBySubject(programId?: number): Promise<DemandBySubject[]> {
    const params = programId ? { programId } : {};
    const response = await api.get<DemandBySubject[]>('/academic-projection/demand-by-subject', { params });
    return response.data;
  },

  async getDemandByLevel(categoryMoodleId?: number): Promise<DemandByLevel[]> {
    const params = categoryMoodleId ? { categoryMoodleId } : {};
    const response = await api.get<DemandByLevel[]>('/academic-projection/demand-by-level', { params });
    return response.data;
  },

  async getSectionProjection(categoryMoodleId?: number): Promise<SectionProjection[]> {
    const params = categoryMoodleId ? { categoryMoodleId } : {};
    const response = await api.get<SectionProjection[]>('/academic-projection/section-projection', { params });
    return response.data;
  },

  async getProjectionMatrix(categoryMoodleId?: number): Promise<ProjectionMatrixRow[]> {
    const params = categoryMoodleId ? { categoryMoodleId } : {};
    const response = await api.get<ProjectionMatrixRow[]>('/academic-projection/matrix', { params });
    return response.data;
  },

  async exportDemandBySubject(categoryMoodleId?: number): Promise<Blob> {
    const params = categoryMoodleId ? { categoryMoodleId, format: 'excel' } : { format: 'excel' };
    const response = await api.get('/academic-projection/demand-by-subject', { params, responseType: 'blob' });
    return response.data;
  },

  async exportDemandByLevel(categoryMoodleId?: number): Promise<Blob> {
    const params = categoryMoodleId ? { categoryMoodleId, format: 'excel' } : { format: 'excel' };
    const response = await api.get('/academic-projection/demand-by-level', { params, responseType: 'blob' });
    return response.data;
  },

  async exportSectionProjection(categoryMoodleId?: number): Promise<Blob> {
    const params = categoryMoodleId ? { categoryMoodleId, format: 'excel' } : { format: 'excel' };
    const response = await api.get('/academic-projection/section-projection', { params, responseType: 'blob' });
    return response.data;
  },

  async exportProjectionMatrix(categoryMoodleId?: number): Promise<Blob> {
    const params = categoryMoodleId ? { categoryMoodleId, format: 'excel' } : { format: 'excel' };
    const response = await api.get('/academic-projection/matrix', { params, responseType: 'blob' });
    return response.data;
  },

  async getStudentGradesByProgram(programId: number, page: number = 1, limit: number = 10): Promise<PagedStudentGrades> {
    const response = await api.get<PagedStudentGrades>('/academic-projection/student-grades-by-program', {
      params: { programId, page, limit },
    });
    return response.data;
  },

  async getStudentGradesByCategory(categoryMoodleId: number, page: number = 1, limit: number = 10): Promise<PagedStudentGrades> {
    const response = await api.get<PagedStudentGrades>('/academic-projection/student-grades-by-program', {
      params: { categoryMoodleId, page, limit },
    });
    return response.data;
  },

  async getStudentGradesMatrix(categoryMoodleId: number, page: number = 1, limit: number = 10): Promise<StudentGradesMatrix> {
    const response = await api.get<StudentGradesMatrix>('/academic-projection/student-grades-matrix', {
      params: { categoryMoodleId, page, limit },
    });
    return response.data;
  },
};
