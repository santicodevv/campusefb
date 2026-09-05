import { useEffect } from 'react';
import { Users as UsersIcon, UserPlus } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { useUsers } from '@/modules/admin/hooks/useUsers';
import { UsersFilters } from '../../components/users/UsersFilters';
import { UsersTable } from '../../components/users/UsersTable';
import { useNavigate } from 'react-router-dom';

export function SettingsEstudiantes() {
  const usersHook = useUsers();
  const navigate = useNavigate();

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
            <UsersIcon className="h-7 w-7 text-violet-600" />
            Configuración de Estudiantes
          </h1>
          <p className="mt-1 text-gray-600">Gestión de cuentas de estudiantes en el sistema</p>
        </div>
        <Button onClick={() => navigate('/admin/settings/estudiantes/nuevo')} className="bg-violet-600 hover:bg-violet-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Crear Estudiante
        </Button>
      </div>

      <UsersFilters
        {...usersHook}
        hideRoleFilter={true}
      />

      <UsersTable
        {...usersHook}
        showSettingsActions={true}
        editBasePath="/admin/settings/estudiantes"
        entityName="Estudiante"
      />
    </div>
  );
}

export default SettingsEstudiantes;
