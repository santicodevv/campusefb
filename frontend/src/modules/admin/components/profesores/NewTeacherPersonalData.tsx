import { Card, CardContent, Input } from '@/shared/components/ui';
import { Eye, EyeOff } from 'lucide-react';
import type { CreateTeacherForm } from '../../hooks/useNuevoProfesor';

interface NewTeacherPersonalDataProps {
  form: CreateTeacherForm;
  setForm: (form: CreateTeacherForm) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}

export function NewTeacherPersonalData({
  form,
  setForm,
  showPassword,
  setShowPassword,
}: NewTeacherPersonalDataProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5">
          Datos personales
        </h2>
        <div className="space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="Ej: María García López"
            />
            <p className="mt-1 text-xs text-gray-400">
              Se usará como nombre de usuario en Moodle (nombre + apellido).
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email institucional <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="profesor@institución.edu"
            />
            <p className="mt-1 text-xs text-gray-400">
              El prefijo del email (antes del @) será el nombre de usuario en Moodle.
            </p>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña inicial <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
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
  );
}
