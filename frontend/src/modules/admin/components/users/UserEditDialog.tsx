
import { useState } from 'react';
import { X, Save, Eye, EyeOff, Shield } from 'lucide-react';
import { Button, Input, Spinner } from '@/shared/components/ui';
import type { User } from '@/modules/admin/types/user.types';
import type { UseMutationResult } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface RoleOption {
  id: number;
  code: string;
  description?: string;
}

interface UserEditDialogProps {
  user: User;
  onClose: () => void;
  rolesData: RoleOption[];
  updateUser: UseMutationResult<unknown, Error, { id: number; data: Record<string, unknown> }, unknown>;
}

export function UserEditDialog({ user, onClose, rolesData, updateUser }: UserEditDialogProps) {
  const [editForm, setEditForm] = useState({
    displayName: user.displayName || '',
    email: user.email || '',
    password: '',
    isActive: user.isActive,
    selectedRoleIds: user.roles.map((r) => r.id),
  });
  const [showPassword, setShowPassword] = useState(false);

  const toggleRole = (roleId: number) => {
    setEditForm((prev) => {
      const has = prev.selectedRoleIds.includes(roleId);
      return { ...prev, selectedRoleIds: has ? prev.selectedRoleIds.filter((id: number) => id !== roleId) : [...prev.selectedRoleIds, roleId] };
    });
  };

  const getRoleName = (code: string) => {
    switch (code) {
      case 'ADMIN': return 'Administrador';
      case 'TEACHER': return 'Profesor';
      case 'STUDENT': return 'Estudiante';
      default: return code;
    }
  };

  const handleSave = () => {
    const changes: Record<string, unknown> = {};
    if (editForm.displayName !== user.displayName) changes.displayName = editForm.displayName;
    if (editForm.email !== user.email) changes.email = editForm.email;
    if (editForm.password) changes.password = editForm.password;
    if (editForm.isActive !== user.isActive) changes.isActive = editForm.isActive;
    const currentRoleIds = user.roles.map((r) => r.id).sort();
    const newRoleIds = [...editForm.selectedRoleIds].sort();
    if (JSON.stringify(currentRoleIds) !== JSON.stringify(newRoleIds)) changes.roleIds = editForm.selectedRoleIds;
    
    if (Object.keys(changes).length === 0) { toast.error('No hay cambios para guardar'); return; }
    
    updateUser.mutate({ id: user.id, data: changes }, {
        onSuccess: () => onClose()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Editar Usuario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <Input value={editForm.displayName} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} placeholder="Nombre completo" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="correo@ejemplo.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Contraseña <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>
            </label>
            <div className="relative">
              <Input type={showPassword ? 'text' : 'password'} value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="••••••••" className="pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
            <div className="flex flex-wrap gap-2">
              {rolesData?.map((role) => {
                const isSelected = editForm.selectedRoleIds.includes(role.id);
                return (
                  <button key={role.id} type="button" onClick={() => toggleRole(role.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${isSelected ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                    <Shield className="h-3 w-3 inline mr-1" />{getRoleName(role.code)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Estado del usuario</label>
            <button type="button" onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editForm.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editForm.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {user.moodleUserId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700"><strong>Moodle ID:</strong> {user.moodleUserId}</p>
              <p className="text-xs text-blue-600 mt-1">Los cambios se sincronizarán automáticamente con Moodle</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-lg">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={updateUser.isPending}>
            {updateUser.isPending ? <Spinner className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar Cambios
          </Button>
        </div>
      </div>
    </div>
  );
}
