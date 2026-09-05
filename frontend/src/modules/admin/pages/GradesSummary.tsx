import { Card, CardContent } from '@/shared/components/ui';
import { Search } from 'lucide-react';
import { useGradesSummary } from '../hooks/useGradesSummary';
import { GradesSummaryHeader } from '../components/grades-summary/GradesSummaryHeader';
import { GradesSummarySearch } from '../components/grades-summary/GradesSummarySearch';
import { GradesSummaryUserCard } from '../components/grades-summary/GradesSummaryUserCard';
import { GradesSummaryPeriods } from '../components/grades-summary/GradesSummaryPeriods';

export default function GradesSummary() {
  const {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    selectedUserId,
    setSelectedUserId,
    showDropdown,
    setShowDropdown,
    searchResults,
    searchLoading,
    userData,
    gradesLoading,
    stats,
    handleSelectUser,
    getGradeColor,
    formatGrade,
  } = useGradesSummary();

  return (
    <div className="p-6">
      <GradesSummaryHeader />

      <GradesSummarySearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showDropdown={showDropdown}
        setShowDropdown={setShowDropdown}
        debouncedQuery={debouncedQuery}
        searchLoading={searchLoading}
        searchResults={searchResults}
        handleSelectUser={handleSelectUser}
        setSelectedUserId={setSelectedUserId}
      />

      {selectedUserId && userData && (
        <>
          <GradesSummaryUserCard userData={userData} stats={stats} />
          
          <GradesSummaryPeriods
            gradesLoading={gradesLoading}
            userData={userData}
            getGradeColor={getGradeColor}
            formatGrade={formatGrade}
          />
        </>
      )}

      {!selectedUserId && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Busca un usuario para ver el resumen de sus calificaciones</p>
            <p className="text-sm text-gray-400 mt-1">Escribe al menos 2 caracteres para comenzar la busqueda</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
