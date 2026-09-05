import { Mail, Pencil } from 'lucide-react';
import { Badge } from '@/shared/components/ui';
import type { User } from '@/modules/admin/types/user.types';

interface UsersTableRowProps {
  user: User;
  getRoleBadgeVariant: (code: string) => 'default' | 'success' | 'info' | 'secondary';
  getRoleName: (code: string) => string;
  openEditModal: (user: User) => void;
}

export function UsersTableRow({ user, getRoleBadgeVariant, getRoleName, openEditModal }: UsersTableRowProps) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="shrink-0 h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {user.displayName?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 leading-tight">{user.displayName}</div>
            <div className="text-xs text-gray-400">ID: {user.id}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-sm text-gray-700">
          <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="truncate max-w-[200px]">{user.email}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <Badge key={role.id} variant={getRoleBadgeVariant(role.code)}>
              {getRoleName(role.code)}
            </Badge>
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={user.isActive ? 'success' : 'danger'}>
          {user.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 hidden xl:table-cell whitespace-nowrap">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => openEditModal(user)}
          title="Editar usuario"
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
