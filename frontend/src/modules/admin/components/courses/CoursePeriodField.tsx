import { Label, Select, Spinner } from '@/shared/components/ui';
import { GraduationCap } from 'lucide-react';
import type { AcademicPeriod, CreateCourseDto } from '@/shared/types';

interface CoursePeriodFieldProps {
  periods: AcademicPeriod[] | undefined;
  periodsLoading: boolean;
  formData: CreateCourseDto;
  setFormData: React.Dispatch<React.SetStateAction<CreateCourseDto>>;
}

export function CoursePeriodField({ periods, periodsLoading, formData, setFormData }: CoursePeriodFieldProps) {
  return (
    <div>
      <Label htmlFor="periodId">
        <GraduationCap className="h-4 w-4 inline mr-1" />
        Período académico (opcional)
      </Label>
      {periodsLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Spinner className="h-4 w-4" />
          <span className="text-sm text-gray-500">Cargando períodos...</span>
        </div>
      ) : periods && periods.length > 0 ? (
        <Select
          id="periodId"
          name="periodId"
          value={formData.periodId || ''}
          onChange={(e) => setFormData((prev) => ({
            ...prev,
            periodId: e.target.value ? Number(e.target.value) : undefined,
          }))}
        >
          <option value="">Sin asignar a período</option>
          {periods
            .filter((p: AcademicPeriod) => p.status !== 'closed')
            .map((period: AcademicPeriod) => (
              <option key={period.id} value={period.id}>
                {period.name} ({period.status === 'open' ? 'Activo' : 'Planificado'})
              </option>
            ))}
        </Select>
      ) : (
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
          No hay períodos disponibles.
        </div>
      )}
      <p className="text-xs text-gray-500 mt-1">
        El curso estará disponible para reinscripción en este período
      </p>
    </div>
  );
}
