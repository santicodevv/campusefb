import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { useQuery } from '@tanstack/react-query';
import { periodsApi } from '@/shared/api';
import type { User } from '@/modules/admin/types/user.types';
import type { AcademicPeriod, PeriodAvailableCourse } from '@/modules/admin/types/period.types';
import toast from 'react-hot-toast';

interface AddGradeModalProps {
  user: User;
  onClose: () => void;
}

export function AddGradeModal({ user, onClose }: AddGradeModalProps) {
  const [form, setForm] = useState({
    periodId: '',
    courseId: '',
    grade: '',
    comments: '',
    isConvalidated: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Obtener periodos reales
  const { data: periods = [] } = useQuery({
    queryKey: ['admin-periods'],
    queryFn: () => periodsApi.getAll(),
  });

  // Obtener materias del periodo seleccionado
  const { data: availableCourses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['period-available-courses', form.periodId],
    queryFn: () => periodsApi.getAllAvailableCourses(Number(form.periodId)),
    enabled: !!form.periodId,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Aquí iría la llamada a la API real
    setTimeout(() => {
      toast.success('Nota guardada correctamente (Simulado)');
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Editar Notas</h2>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form id="grade-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Matricula */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Matricula
              </label>
              <input
                type="text"
                readOnly
                value={user.id}
                className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600 cursor-not-allowed outline-none"
              />
            </div>

            {/* Ciclo */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Ciclo
              </label>
              <select 
                value={form.periodId}
                onChange={(e) => setForm({...form, periodId: e.target.value, courseId: ''})}
                className="w-full px-3 py-2 border border-blue-400 rounded-md outline-none focus:ring-2 focus:ring-blue-100 bg-white"
              >
                <option value="">Seleccionar ciclo...</option>
                {(periods as AcademicPeriod[]).map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name} ({period.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Materia */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Materia
              </label>
              <select 
                value={form.courseId}
                onChange={(e) => setForm({...form, courseId: e.target.value})}
                disabled={!form.periodId || isLoadingCourses}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">Seleccionar materia...</option>
                {(availableCourses as PeriodAvailableCourse[]).map((course) => (
                  <option key={course.id || course.courseMoodleId} value={course.courseMoodleId}>
                    {course.courseName || 'Curso sin nombre'}
                  </option>
                ))}
              </select>
            </div>

            {/* Nota */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Nota
              </label>
              <input
                type="text"
                value={form.grade}
                onChange={(e) => setForm({...form, grade: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Comentario */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Comentario
              </label>
              <textarea
                value={form.comments}
                onChange={(e) => setForm({...form, comments: e.target.value})}
                placeholder="Comentario sobre esta accion"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>

            {/* Materia Convalidada */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="convalidada"
                checked={form.isConvalidated}
                onChange={(e) => setForm({...form, isConvalidated: e.target.checked})}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="convalidada" className="text-sm font-bold text-gray-700 cursor-pointer">
                Materia Convalidada
              </label>
            </div>
            
          </form>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-center bg-gray-50/50">
          <Button 
            type="submit" 
            form="grade-form"
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
