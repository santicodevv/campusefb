import { Input, Label } from '@/shared/components/ui';
import type { CreateCourseDto } from '@/shared/types';

interface CourseBasicInfoFieldsProps {
  formData: CreateCourseDto;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CourseBasicInfoFields({ formData, handleInputChange }: CourseBasicInfoFieldsProps) {
  return (
    <>
      <div>
        <Label htmlFor="fullname">
          Nombre completo del curso <span className="text-red-500">*</span>
        </Label>
        <Input
          id="fullname"
          name="fullname"
          value={formData.fullname}
          onChange={handleInputChange}
          placeholder="Ej: Matematicas I - 2024"
          required
        />
      </div>

      <div>
        <Label htmlFor="code">Código (opcional)</Label>
        <Input
          id="code"
          name="code"
          value={formData.code || ''}
          onChange={handleInputChange}
          placeholder="Ej: TEO101"
        />
        <p className="text-xs text-gray-500 mt-1">
          Código que se mostrará en el record de notas
        </p>
      </div>

      <div>
        <Label htmlFor="shortname">
          Grupo <span className="text-red-500">*</span>
        </Label>
        <Input
          id="shortname"
          name="shortname"
          value={formData.shortname}
          onChange={handleInputChange}
          placeholder="Ej: MAT101-2024"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Identificador del grupo (viene del sync de Moodle)
        </p>
      </div>
    </>
  );
}
