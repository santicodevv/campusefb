import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/shared/components/ui';
import { useGradeEntry } from '@/modules/teacher/hooks/useGradeEntry';
import { GradeEntryTable } from '../components/grades/GradeEntryTable';
import { TeacherGradeEntryHeader } from '../components/grades/TeacherGradeEntryHeader';
import { TeacherGradeEntryAlert } from '../components/grades/TeacherGradeEntryAlert';
import { TeacherGradeEntryLegend } from '../components/grades/TeacherGradeEntryLegend';
import { TeacherGradeEntryError } from '../components/grades/TeacherGradeEntryError';

export default function TeacherGradeEntry() {
  const navigate = useNavigate();
  const gradesHook = useGradeEntry();

  const handleBack = () => navigate('/teacher/courses');

  if (gradesHook.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (gradesHook.error || !gradesHook.data) {
    return <TeacherGradeEntryError onBack={handleBack} />;
  }

  const { data, localEdits, saveGrade, deleteGrade, handleGradeChange, handleSaveGrade } = gradesHook;
  const isEditingEnabled = data.editSession?.isActive ?? false;
  const course = data.course;

  return (
    <div className="p-6">
      <TeacherGradeEntryHeader
        courseName={course?.fullname}
        courseShortName={course?.shortname}
        isEditingEnabled={isEditingEnabled}
        onBack={handleBack}
      />

      <TeacherGradeEntryAlert isEditingEnabled={isEditingEnabled} />

      <GradeEntryTable
        data={data}
        localEdits={localEdits}
        handleGradeChange={handleGradeChange}
        handleSaveGrade={handleSaveGrade}
        saveGrade={saveGrade}
        deleteGrade={deleteGrade}
        isEditingEnabled={isEditingEnabled}
      />

      <TeacherGradeEntryLegend />
    </div>
  );
}
