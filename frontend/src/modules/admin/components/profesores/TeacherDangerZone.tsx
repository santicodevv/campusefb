import { Card, CardContent } from '@/shared/components/ui';
import { UserX, Trash2, Shield } from 'lucide-react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { User } from '@/modules/admin/types/user.types';
import type { EditForm } from '../../hooks/useEditarProfesor';

interface TeacherDangerZoneProps {
  form: EditForm;
  isTeacher: boolean;
  confirmRemoveRole: boolean;
  setConfirmRemoveRole: (val: boolean) => void;
  confirmDelete: boolean;
  setConfirmDelete: (val: boolean) => void;
  removeRoleMutation: UseMutationResult<User, Error, void>;
  deactivateMutation: UseMutationResult<User, Error, void>;
}

export function TeacherDangerZone({
  form,
  isTeacher,
  confirmRemoveRole,
  setConfirmRemoveRole,
  confirmDelete,
  setConfirmDelete,
  removeRoleMutation,
  deactivateMutation,
}: TeacherDangerZoneProps) {
  return (
    <Card className="mt-5">
      <CardContent className="p-6">
        <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-1">
          Zona de peligro
        </h2>
        <p className="text-xs text-gray-400 mb-5">Estas acciones pueden tener efectos irreversibles.</p>

        <div className="space-y-4">
          {/* Quitar rol de Profesor */}
          {isTeacher && (
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50/50">
              <div>
                <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-amber-500" />
                  Quitar rol de Profesor
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  El usuario permanece en el sistema pero pierde acceso como Profesor.
                </p>
              </div>
              {confirmRemoveRole ? (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-amber-700 font-medium">¿Confirmar?</span>
                  <button
                    onClick={() => { removeRoleMutation.mutate(); setConfirmRemoveRole(false); }}
                    disabled={removeRoleMutation.isPending}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    {removeRoleMutation.isPending ? '...' : 'Sí, quitar'}
                  </button>
                  <button
                    onClick={() => setConfirmRemoveRole(false)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRemoveRole(true)}
                  className="self-start mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors"
                >
                  <UserX className="h-3.5 w-3.5" />
                  Quitar rol
                </button>
              )}
            </div>
          )}

          {/* Desactivar cuenta */}
          {form.isActive && (
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-red-200 bg-red-50/50">
              <div>
                <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                  <Trash2 className="h-4 w-4 text-red-400" />
                  Desactivar cuenta
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  El usuario no podrá iniciar sesión. Sus datos se conservan.
                </p>
              </div>
              {confirmDelete ? (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-red-700 font-medium">¿Confirmar?</span>
                  <button
                    onClick={() => { deactivateMutation.mutate(); setConfirmDelete(false); }}
                    disabled={deactivateMutation.isPending}
                    className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {deactivateMutation.isPending ? '...' : 'Sí, desactivar'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="self-start mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Desactivar
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
