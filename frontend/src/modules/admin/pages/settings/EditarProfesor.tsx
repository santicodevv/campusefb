import { Button, Spinner } from '@/shared/components/ui';
import { AlertCircle, Save } from 'lucide-react';
import { useEditarProfesor } from '../../hooks/useEditarProfesor';
import { TeacherHeader } from '../../components/profesores/TeacherHeader';
import { TeacherPersonalData } from '../../components/profesores/TeacherPersonalData';
import { TeacherAccountStatus } from '../../components/profesores/TeacherAccountStatus';
import { TeacherDangerZone } from '../../components/profesores/TeacherDangerZone';

export function EditarProfesor() {
  const {
    navigate,
    teacher,
    isLoading,
    form,
    setForm,
    showPassword,
    setShowPassword,
    confirmRemoveRole,
    setConfirmRemoveRole,
    confirmDelete,
    setConfirmDelete,
    isTeacher,
    updateMutation,
    removeRoleMutation,
    deactivateMutation,
    handleSave,
  } = useEditarProfesor();

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <AlertCircle className="h-12 w-12 mb-3 text-gray-200" />
        <p className="text-base font-medium text-gray-500">Profesor no encontrado</p>
        <button
          onClick={() => navigate('/admin/settings/profesores')}
          className="mt-4 text-sm text-violet-600 hover:underline"
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <TeacherHeader teacher={teacher} navigate={navigate} />

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN (7 columns) ── */}
        <div className="lg:col-span-7 space-y-5">
          <TeacherPersonalData 
            teacher={teacher}
            form={form}
            setForm={setForm}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
          <TeacherAccountStatus 
            form={form}
            setForm={setForm}
          />
        </div>

        {/* ── RIGHT COLUMN (5 columns) ── */}
        <div className="lg:col-span-5 space-y-5">
          {/* Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/settings/profesores')}
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending} className="flex-1 bg-violet-600 hover:bg-violet-700">
              {updateMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar Cambios
            </Button>
          </div>

          <TeacherDangerZone 
            form={form}
            isTeacher={isTeacher}
            confirmRemoveRole={confirmRemoveRole}
            setConfirmRemoveRole={setConfirmRemoveRole}
            confirmDelete={confirmDelete}
            setConfirmDelete={setConfirmDelete}
            removeRoleMutation={removeRoleMutation}
            deactivateMutation={deactivateMutation}
          />
        </div>
      </div>
    </div>
  );
}

export default EditarProfesor;