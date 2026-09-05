import { Input } from '@/shared/components/ui';
import { Eye, EyeOff } from 'lucide-react';
import type { CreateUserFormData } from '../../hooks/useUserCreate';

interface UserBasicInfoFieldsProps {
  createForm: CreateUserFormData;
  setCreateForm: React.Dispatch<React.SetStateAction<CreateUserFormData>>;
  showCreatePassword: boolean;
  setShowCreatePassword: (val: boolean) => void;
}

export function UserBasicInfoFields({
  createForm,
  setCreateForm,
  showCreatePassword,
  setShowCreatePassword,
}: UserBasicInfoFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre <span className="text-gray-400">(opcional)</span>
        </label>
        <Input
          value={createForm.displayName}
          onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
          placeholder="Nombre completo"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <Input
          type="email"
          value={createForm.email}
          onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
          placeholder="correo@ejemplo.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Input
            type={showCreatePassword ? 'text' : 'password'}
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            placeholder="Mínimo 6 caracteres"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowCreatePassword(!showCreatePassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </>
  );
}
