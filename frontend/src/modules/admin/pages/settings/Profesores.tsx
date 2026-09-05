import { useSettingsProfesores } from '../../hooks/useSettingsProfesores';
import { TeachersListHeader } from '../../components/profesores/TeachersListHeader';
import { TeachersListSearch } from '../../components/profesores/TeachersListSearch';
import { TeachersTable } from '../../components/profesores/TeachersTable';

export function SettingsProfesores() {
  const {
    navigate,
    search,
    setSearch,
    page,
    setPage,
    data,
    isLoading,
    totalPages,
    pageRange,
  } = useSettingsProfesores();

  return (
    <div>
      <TeachersListHeader navigate={navigate} />

      <TeachersListSearch 
        search={search}
        setSearch={setSearch}
        setPage={setPage}
        data={data}
      />

      <TeachersTable 
        data={data}
        isLoading={isLoading}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        pageRange={pageRange}
        search={search}
        navigate={navigate}
      />
    </div>
  );
}

export default SettingsProfesores;
