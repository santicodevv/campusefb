import { X, UserPlus } from 'lucide-react';
import { Button, Spinner } from '@/shared/components/ui';
import type { UseMutationResult } from '@tanstack/react-query';
import { useUserCreate } from '../../hooks/useUserCreate';
import type { User, CreateUserRequest } from '@/shared/types';
import { UserBasicInfoFields } from './UserBasicInfoFields';
import { UserRolesField } from './UserRolesField';
import { UserStatusField } from './UserStatusField';

export interface RoleData {
  id: number;
  code: string;
}

interface UserCreateDialogProps {
  onClose: () => void;
  rolesData: RoleData[] | undefined;
  createUser: UseMutationResult<User, Error, CreateUserRequest>;
}

export function UserCreateDialog({ onClose, rolesData, createUser }: UserCreateDialogProps) {
  const {
    createForm,
    setCreateForm,
    showCreatePassword,
    setShowCreatePassword,
    toggleCreateRole,
    getRoleName,
    handleCreate,
  } = useUserCreate({ onClose, createUser });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Crear Nuevo Usuario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <UserBasicInfoFields
            createForm={createForm}
            setCreateForm={setCreateForm}
            showCreatePassword={showCreatePassword}
            setShowCreatePassword={setShowCreatePassword}
          />

          <UserRolesField
            rolesData={rolesData}
            selectedRoleIds={createForm.selectedRoleIds}
            toggleCreateRole={toggleCreateRole}
            getRoleName={getRoleName}
          />

          <UserStatusField
            isActive={createForm.isActive}
            onToggle={() => setCreateForm({ ...createForm, isActive: !createForm.isActive })}
          />
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-lg">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={createUser.isPending}>
            {createUser.isPending ? <Spinner className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
            Crear Usuario
          </Button>
        </div>
      </div>
    </div>
  );
}
