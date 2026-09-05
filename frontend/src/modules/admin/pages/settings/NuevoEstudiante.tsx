import { Button, Spinner } from '@/shared/components/ui';
import { Save, Shield, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useNuevoEstudiante } from '../../hooks/useNuevoEstudiante';
import { Card, CardContent } from '@/shared/components/ui';

export function SettingsNuevoEstudiante() {
  const {
    navigate,
    form,
    setForm,
    showPassword,
    setShowPassword,
    createStudent,
    handleSubmit,
  } = useNuevoEstudiante();

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserPlus className="h-7 w-7 text-violet-600" />
          Crear Estudiante
        </h1>
        <p className="mt-1 text-gray-600">Registra un nuevo estudiante en el sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-5">
          <Card>
            <CardContent className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos Personales</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                    placeholder="estudiante@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none pr-10"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <Card>
            <CardContent className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración Adicional</h2>
              <div className="space-y-4">
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-600"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">Usuario Activo</span>
                    <span className="text-xs text-gray-500">Permitir que el estudiante inicie sesión</span>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      type="checkbox"
                      checked={form.syncToMoodle}
                      onChange={(e) => setForm({ ...form, syncToMoodle: e.target.checked })}
                      className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-600"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">Sincronizar con Moodle</span>
                    <span className="text-xs text-gray-500">Crear automáticamente la cuenta en la plataforma Moodle</span>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-start gap-3 px-4 py-3.5 bg-violet-50 border border-violet-100 rounded-xl">
            <Shield className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
            <p className="text-sm text-violet-700">
              Se asignará automáticamente el rol <strong>Estudiante (STUDENT)</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/settings/estudiantes')}
              disabled={createStudent.isPending}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createStudent.isPending} className="flex-1 bg-violet-600 hover:bg-violet-700">
              {createStudent.isPending ? (
                <Spinner className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Crear Estudiante
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsNuevoEstudiante;
