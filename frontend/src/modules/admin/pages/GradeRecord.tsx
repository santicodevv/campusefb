import { Card, CardContent, Button } from '@/shared/components/ui';
import { FileText } from 'lucide-react';
import { useAdminGradeRecord } from '../hooks/useAdminGradeRecord';
import { GradeRecordHeader } from '../components/grade-record/GradeRecordHeader';
import { GradeRecordSearch } from '../components/grade-record/GradeRecordSearch';
import { GradeRecordUserBar } from '../components/grade-record/GradeRecordUserBar';
import { GradeRecordPreview } from '../components/grade-record/GradeRecordPreview';

export default function AdminGradeRecord() {
  const {
    searchQuery,
    setSearchQuery,
    selectedUserId,
    setSelectedUserId,
    showSearch,
    setShowSearch,
    printRef,
    docNumber,
    searchResults,
    searchLoading,
    userGrades,
    gradesLoading,
    allCourses,
    handleSelectUser,
    handlePrint,
    today,
  } = useAdminGradeRecord();

  return (
    <div className="p-6">
      <GradeRecordHeader />

      {showSearch && (
        <GradeRecordSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchLoading={searchLoading}
          searchResults={searchResults}
          handleSelectUser={handleSelectUser}
        />
      )}

      {selectedUserId && (
        <>
          <GradeRecordUserBar
            userGrades={userGrades}
            setSelectedUserId={setSelectedUserId}
            setShowSearch={setShowSearch}
            handlePrint={handlePrint}
            gradesLoading={gradesLoading}
          />

          <GradeRecordPreview
            gradesLoading={gradesLoading}
            userGrades={userGrades}
            allCourses={allCourses}
            handlePrint={handlePrint}
            printRef={printRef}
            today={today}
            docNumber={docNumber}
          />
        </>
      )}

      {!selectedUserId && !showSearch && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Selecciona un estudiante para generar su record de notas</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowSearch(true)}>
              Buscar Estudiante
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
