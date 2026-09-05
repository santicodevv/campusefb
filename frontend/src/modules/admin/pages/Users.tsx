import { useEffect } from 'react';
import { Users as UsersIcon } from 'lucide-react';
import { useUsers } from '@/modules/admin/hooks/useUsers';
import { UsersFilters } from '../components/users/UsersFilters';
import { UsersTable } from '../components/users/UsersTable';

export default function AdminUsers() {
  const usersHook = useUsers();

  // Forzar que solo se muestren estudiantes
  useEffect(() => {
    usersHook.setFilterRole('STUDENT');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UsersIcon className="h-7 w-7 text-blue-600" />
            Estudiantes
          </h1>
          <p className="mt-1 text-gray-600">Listado y gestión de estudiantes</p>
        </div>
        
      </div>

      <UsersFilters
        {...usersHook}
        hideRoleFilter={true}
      />

      <UsersTable
        {...usersHook}
        
      />
    </div>
  );
}
