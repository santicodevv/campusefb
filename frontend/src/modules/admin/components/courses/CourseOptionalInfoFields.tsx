import { Input, Label } from '@/shared/components/ui';
import type { CreateCourseDto } from '@/shared/types';

interface CourseOptionalInfoFieldsProps {
  formData: CreateCourseDto;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function CourseOptionalInfoFields({ formData, handleInputChange }: CourseOptionalInfoFieldsProps) {
  return (
    <>
      <div>
        <Label htmlFor="idnumber">Numero ID del curso (opcional)</Label>
        <Input
          id="idnumber"
          name="idnumber"
          value={formData.idnumber}
          onChange={handleInputChange}
          placeholder="Ej: 2024-MAT-001"
        />
        <p className="text-xs text-gray-500 mt-1">
          Identificador externo para integraciones
        </p>
      </div>

      <div>
        <Label htmlFor="summary">Descripcion del curso (opcional)</Label>
        <textarea
          id="summary"
          name="summary"
          value={formData.summary}
          onChange={handleInputChange}
          rows={3}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Descripcion breve del curso..."
        />
      </div>
    </>
  );
}
