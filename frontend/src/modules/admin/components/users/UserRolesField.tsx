import { Shield } from 'lucide-react';

interface RoleData {
  id: number;
  code: string;
}

interface UserRolesFieldProps {
  rolesData: RoleData[] | undefined;
  selectedRoleIds: number[];
  toggleCreateRole: (roleId: number) => void;
  getRoleName: (code: string) => string;
}

export function UserRolesField({
  rolesData,
  selectedRoleIds,
  toggleCreateRole,
  getRoleName,
}: UserRolesFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Roles <span className="text-red-500">*</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {rolesData?.map((role) => {
          const isSelected = selectedRoleIds.includes(role.id);
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => toggleCreateRole(role.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                isSelected
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Shield className="h-3 w-3 inline mr-1" />
              {getRoleName(role.code)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
