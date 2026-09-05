import { Button, Spinner } from '@/shared/components/ui';
import { Save, Shield, ArrowLeft, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useEditarUsuario } from '../../hooks/useEditarUsuario';
import { Card, CardContent } from '@/shared/components/ui';
import { Modal, ModalFooter } from '@/shared/components/ui/Modal';

export function SettingsEditarUsuario() {
  const {
    navigate,
    adminUser,
    isLoading,
    form,
    setForm,
    showPassword,
    setShowPassword,
    confirmRemoveRole,
    setConfirmRemoveRole,
    isAdmin,
    updateMutation,
    removeRoleMutation,
    handleSave,
  } = useEditarUsuario();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-8 w-8 text-violet-600" />
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Usuario no encontrado</h2>
        <Button className="mt-4" onClick={() => navigate('/admin/settings/usuarios')}>
          Volver a Usuarios
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/settings/usuarios')} className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-7 w-7 text-violet-600" />
            Editar Administrador
          </h1>
          <p className="mt-1 text-gray-600">{adminUser.displayName || adminUser.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-5">
          <Card>
            <CardContent className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos Personales</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña (Dejar en blanco para no cambiar)</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none pr-10"
                      placeholder="Nueva contraseña"
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración y Rol</h2>
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
                    <span className="text-xs text-gray-500">Si se desactiva, no podrá iniciar sesión.</span>
                  </div>
                </label>

                {isAdmin && (
                  <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                    <div className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-orange-800">Quitar Rol de Administrador</h4>
                        <p className="text-xs text-orange-700 mt-1 mb-3">Esta acción le quitará los privilegios administrativos al usuario.</p>
                        <Button variant="outline" size="sm" onClick={() => setConfirmRemoveRole(true)} className="text-orange-700 border-orange-300 hover:bg-orange-100">
                          Remover Rol ADMIN
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate('/admin/settings/usuarios')} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending} className="flex-1 bg-violet-600 hover:bg-violet-700">
              {updateMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar Cambios
            </Button>
          </div>
        </div>
      </div>

      {/* Modal para quitar rol ADMIN */}
      <Modal isOpen={confirmRemoveRole} onClose={() => setConfirmRemoveRole(false)} title="Remover Rol de Administrador" description="¿Estás seguro de que deseas quitar los privilegios administrativos a este usuario?">
        <ModalFooter>
          <Button variant="outline" onClick={() => setConfirmRemoveRole(false)} disabled={removeRoleMutation.isPending}>Cancelar</Button>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => removeRoleMutation.mutate()} disabled={removeRoleMutation.isPending}>
            {removeRoleMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null} Remover Rol
          </Button>
        </ModalFooter>
      </Modal>

    </div>
  );
}

export default SettingsEditarUsuario;
