import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '@/modules/admin/api/users.api';
import { Spinner, Badge, Button } from '@/shared/components/ui';
import { Modal, ModalFooter } from '@/shared/components/ui/Modal';
import { formatDate } from '@/shared/lib/utils';
import { buildPageRange } from '../../hooks/useUsersTable';
import { UsersTablePagination } from './UsersTablePagination';
import type { User } from '@/modules/admin/types/user.types';

interface UsersTableProps {
  showSettingsActions?: boolean;
  editBasePath?: string;
  entityName?: string;
  data?: { users: User[]; total: number; page: number };
  isLoading: boolean;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  limit: number;
  setLimit: (l: number) => void;
}

export function UsersTable({ data, isLoading, page, setPage, limit, setLimit, showSettingsActions = false, editBasePath = '/admin/settings/estudiantes', entityName = 'Estudiante' }: UsersTableProps) {
  const navigate = useNavigate();
  const [jumpInput, setJumpInput] = useState('');
  const totalPages = data ? Math.ceil(data.total / limit) : 1;
  const handleJumpPage = useMemo(() => () => {
    const n = parseInt(jumpInput, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      setPage(n);
      setJumpInput('');
    }
  }, [jumpInput, totalPages, setPage]);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await usersApi.delete(deleteId);
      toast.success(`${entityName} eliminado correctamente`);
      setPage(1); // Refresh data
      window.location.reload(); // Simple refresh for now
    } catch {
      toast.error(`Error al eliminar ${entityName.toLowerCase()}`);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-48"><Spinner /></div>;
  }

  if (!data?.users.length) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500">No se encontraron estudiantes</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col mt-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Correo</th>
              <th className="px-6 py-4">Último Acceso</th>
              <th className="px-6 py-4 text-center">Act</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{user.username || user.email.split('@')[0]}</div>
                  {!user.isActive && <Badge variant="secondary" className="mt-1">Inactivo</Badge>}
                </td>
                <td className="px-6 py-4 text-gray-600">{user.displayName}</td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4 text-gray-500">
                  {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Nunca'}
                </td>
                <td className="px-6 py-4 text-center">
                  {!showSettingsActions ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                        onClick={() => navigate(`${editBasePath}/${user.id}/editar`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                        onClick={() => setDeleteId(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UsersTablePagination
        total={data.total}
        limit={limit}
        setLimit={setLimit}
        page={page}
        setPage={setPage}
        totalPages={Math.ceil(data.total / limit)}
        pageRange={buildPageRange(page, Math.ceil(data.total / limit))}
        jumpInput={jumpInput}
        setJumpInput={setJumpInput}
        handleJumpPage={handleJumpPage}
      />

      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title={`Eliminar ${entityName}`}
        description={`Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este ${entityName.toLowerCase()}?`}
      >
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Spinner className="h-4 w-4 mr-2" /> : null}
            Eliminar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
