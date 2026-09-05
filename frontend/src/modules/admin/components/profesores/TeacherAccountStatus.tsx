import { Card, CardContent } from '@/shared/components/ui';
import { cn } from '@/shared/lib';
import type { EditForm } from '../../hooks/useEditarProfesor';

interface TeacherAccountStatusProps {
  form: EditForm;
  setForm: (form: EditForm) => void;
}

export function TeacherAccountStatus({ form, setForm }: TeacherAccountStatusProps) {
  return (
    <Card className="mt-5">
      <CardContent className="p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5">
          Estado de la cuenta
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Cuenta activa</p>
            <p className="text-xs text-gray-400 mt-0.5">El profesor puede iniciar sesión</p>
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
      </CardContent>
    </Card>
  );
}
