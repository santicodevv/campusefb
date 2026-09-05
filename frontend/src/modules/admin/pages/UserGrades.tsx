import { useUserGrades } from '../hooks/useUserGrades';
import { UserGradesHeader } from '../components/userGrades/UserGradesHeader';
import { UserSearch } from '../components/userGrades/UserSearch';
import { UserInfoCard } from '../components/userGrades/UserInfoCard';
import { UserGradesStats } from '../components/userGrades/UserGradesStats';
import { UserGradesTable } from '../components/userGrades/UserGradesTable';
import { UserGradesEmpty } from '../components/userGrades/UserGradesEmpty';

export default function UserGrades() {
  const hookState = useUserGrades();

  return (
    <div className="p-6">
      <UserGradesHeader />
      
      <UserSearch
        searchQuery={hookState.searchQuery}
        setSearchQuery={hookState.setSearchQuery}
        debouncedQuery={hookState.debouncedQuery}
        showDropdown={hookState.showDropdown}
        setShowDropdown={hookState.setShowDropdown}
        setSelectedUserId={hookState.setSelectedUserId}
        searchLoading={hookState.searchLoading}
        searchResults={hookState.searchResults}
        handleSelectUser={hookState.handleSelectUser}
      />

      {hookState.selectedUserId && hookState.userData ? (
        <>
          <UserInfoCard user={hookState.userData.user} />
          <UserGradesStats stats={hookState.stats} />
          <UserGradesTable
            gradesLoading={hookState.gradesLoading}
            allCourses={hookState.allCourses}
          />
        </>
      ) : (
        !hookState.selectedUserId && <UserGradesEmpty />
      )}
    </div>
  );
}
