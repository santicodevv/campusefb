import { Button, Spinner } from '@/shared/components/ui';
import { BookOpen, Users, ClipboardList, ArrowLeft } from 'lucide-react';
import { useCourseDetail } from '../hooks/useCourseDetail';
import { CourseDetailHeader } from '../components/course-detail/CourseDetailHeader';
import { CourseDetailStats } from '../components/course-detail/CourseDetailStats';
import { CourseInfoCard } from '../components/course-detail/CourseInfoCard';
import { CourseEnrolledUsers } from '../components/course-detail/CourseEnrolledUsers';
import { CourseAssignedTeachers } from '../components/course-detail/CourseAssignedTeachers';
import { CourseGradesTab } from '../components/course-detail/CourseGradesTab';
import { CourseAddTeacherModal } from '../components/course-detail/CourseAddTeacherModal';
import { CourseAddStudentModal } from '../components/course-detail/CourseAddStudentModal';

export default function AdminCourseDetail() {
  const {
    navigate,
    courseId,
    course,
    courseLoading,
    enrolledUsers,
    usersLoading,
    assignedTeachers,
    teachersLoading,
    courseGrades,
    gradesLoading,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    showAddTeacherModal,
    setShowAddTeacherModal,
    showAddStudentModal,
    setShowAddStudentModal,
    teacherSearch,
    setTeacherSearch,
    activeTab,
    setActiveTab,
    gradesSearch,
    setGradesSearch,
    availableTeachers,
    assignTeacherMutation,
    removeTeacherMutation,
    setPrimaryMutation,
    enrollStudentMutation,
    unenrollStudentMutation,
    filteredUsers,
    students,
    teachers,
  } = useCourseDetail();

  if (courseLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Curso no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/courses')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Cursos
        </Button>
      </div>
    );
  }

  return (
    <div>
      <CourseDetailHeader navigate={navigate} course={course} />

      <div className="flex gap-2 mb-6">
        <Button variant={activeTab === 'users' ? 'primary' : 'outline'} onClick={() => setActiveTab('users')}>
          <Users className="h-4 w-4 mr-2" />
          Usuarios Inscritos
        </Button>
        <Button variant={activeTab === 'grades' ? 'primary' : 'outline'} onClick={() => setActiveTab('grades')}>
          <ClipboardList className="h-4 w-4 mr-2" />
          Calificaciones
        </Button>
      </div>

      <CourseDetailStats course={course} studentsCount={students.length} teachersCount={teachers.length} />

      {activeTab === 'users' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <CourseInfoCard course={course} />
            <CourseEnrolledUsers
              enrolledUsers={enrolledUsers}
              filteredUsers={filteredUsers}
              usersLoading={usersLoading}
              search={search}
              setSearch={setSearch}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
              studentsCount={students.length}
              teachersCount={teachers.length}
              onAddStudent={() => setShowAddStudentModal(true)}
              unenrollStudentMutation={unenrollStudentMutation}
            />
          </div>

          <CourseAssignedTeachers 
            assignedTeachers={assignedTeachers}
            teachersLoading={teachersLoading}
            setShowAddTeacherModal={setShowAddTeacherModal}
            setPrimaryMutation={setPrimaryMutation}
            removeTeacherMutation={removeTeacherMutation}
          />
        </>
      )}

      {activeTab === 'grades' && (
        <CourseGradesTab 
          courseGrades={courseGrades}
          gradesLoading={gradesLoading}
          gradesSearch={gradesSearch}
          setGradesSearch={setGradesSearch}
        />
      )}

      <CourseAddTeacherModal
        showAddTeacherModal={showAddTeacherModal}
        setShowAddTeacherModal={setShowAddTeacherModal}
        teacherSearch={teacherSearch}
        setTeacherSearch={setTeacherSearch}
        availableTeachers={availableTeachers}
        assignTeacherMutation={assignTeacherMutation}
      />

      <CourseAddStudentModal
        courseId={Number(courseId)}
        showModal={showAddStudentModal}
        setShowModal={setShowAddStudentModal}
        enrollStudentMutation={enrollStudentMutation}
      />
    </div>
  );
}
