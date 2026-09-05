import { Card, CardContent, Input } from '@/shared/components/ui';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import type { User } from '@/modules/admin/types/user.types';
import type { EditForm } from '../../hooks/useEditarProfesor';

interface TeacherPersonalDataProps {
  teacher: User;
  form: EditForm;
  setForm: (form: EditForm) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}

export function TeacherPersonalData({
  teacher,
  form,
  setForm,
  showPassword,
  setShowPassword,
}: TeacherPersonalDataProps) {
  return (
    <>
      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5">
            Datos personales
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {teacher.moodleUserId && (
                <p className="mt-1 text-xs text-amber-600">
                  ⚠️ Los cambios de email se sincronizarán con Moodle automáticamente.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nueva contraseña{' '}
                <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moodle info */}
      {teacher.moodleUserId && (
        <div className="flex items-start gap-3 px-4 py-3.5 bg-emerald-50 border border-emerald-100 rounded-xl mt-5">
          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700">
            Vinculado a Moodle con ID <strong>{teacher.moodleUserId}</strong>.
            Los cambios se sincronizarán automáticamente.
          </p>
        </div>
      )}
    </>
  );
}
