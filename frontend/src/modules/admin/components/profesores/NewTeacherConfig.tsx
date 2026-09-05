import { Card, CardContent } from '@/shared/components/ui';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/shared/lib';
import type { CreateTeacherForm } from '../../hooks/useNuevoProfesor';

interface NewTeacherConfigProps {
  form: CreateTeacherForm;
  setForm: (form: CreateTeacherForm) => void;
}

export function NewTeacherConfig({ form, setForm }: NewTeacherConfigProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5">
          Configuración
        </h2>
        <div className="space-y-4">
          {/* Estado activo */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Cuenta activa</p>
              <p className="text-xs text-gray-400 mt-0.5">El profesor puede iniciar sesión en el sistema</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                form.isActive ? 'bg-emerald-500' : 'bg-gray-300',
              )}
            >
              <span className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                form.isActive ? 'translate-x-6' : 'translate-x-1',
              )} />
            </button>
          </div>

          {/* Sync Moodle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-violet-500" />
                Sincronizar con Moodle
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Crea el usuario también en la plataforma Moodle y vincula el ID
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, syncToMoodle: !form.syncToMoodle })}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                form.syncToMoodle ? 'bg-violet-600' : 'bg-gray-300',
              )}
            >
              <span className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                form.syncToMoodle ? 'translate-x-6' : 'translate-x-1',
              )} />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
