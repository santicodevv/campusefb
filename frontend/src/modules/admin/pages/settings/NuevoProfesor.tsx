import { Button, Spinner } from '@/shared/components/ui';
import { Save, Shield } from 'lucide-react';
import { useNuevoProfesor } from '../../hooks/useNuevoProfesor';
import { NewTeacherHeader } from '../../components/profesores/NewTeacherHeader';
import { NewTeacherPersonalData } from '../../components/profesores/NewTeacherPersonalData';
import { NewTeacherConfig } from '../../components/profesores/NewTeacherConfig';

export function NuevoProfesor() {
  const {
    navigate,
    form,
    setForm,
    showPassword,
    setShowPassword,
    createTeacher,
    handleSubmit,
  } = useNuevoProfesor();

  return (
    <div className="max-w-5xl">
      <NewTeacherHeader navigate={navigate} />

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT COLUMN (7 columns) ── */}
        <div className="lg:col-span-7 space-y-5">
          <NewTeacherPersonalData 
            form={form}
            setForm={setForm}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        </div>

        {/* ── RIGHT COLUMN (5 columns) ── */}
        <div className="lg:col-span-5 space-y-5">
          <NewTeacherConfig form={form} setForm={setForm} />

          {/* ── Info de rol ── */}
          <div className="flex items-start gap-3 px-4 py-3.5 bg-violet-50 border border-violet-100 rounded-xl">
            <Shield className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
            <p className="text-sm text-violet-700">
              Se asignará automáticamente el rol <strong>Profesor (TEACHER)</strong>.
              El profesor podrá acceder a sus cursos, registrar calificaciones y gestionar sus grupos.
            </p>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/settings/profesores')}
              disabled={createTeacher.isPending}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createTeacher.isPending} className="flex-1 bg-violet-600 hover:bg-violet-700">
              {createTeacher.isPending ? (
                <Spinner className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Crear Profesor
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default NuevoProfesor;
