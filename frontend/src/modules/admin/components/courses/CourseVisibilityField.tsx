import { Label } from '@/shared/components/ui';
import { Eye, EyeOff } from 'lucide-react';
import type { CreateCourseDto } from '@/shared/types';

interface CourseVisibilityFieldProps {
  formData: CreateCourseDto;
  setFormData: React.Dispatch<React.SetStateAction<CreateCourseDto>>;
}

export function CourseVisibilityField({ formData, setFormData }: CourseVisibilityFieldProps) {
  return (
    <div>
      <Label>Visibilidad del curso</Label>
      <div className="flex gap-4 mt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="visible"
            checked={formData.visible === true}
            onChange={() => setFormData((prev) => ({ ...prev, visible: true }))}
            className="h-4 w-4 text-blue-600"
          />
          <Eye className="h-4 w-4 text-green-600" />
          <span className="text-sm">Mostrar</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="visible"
            checked={formData.visible === false}
            onChange={() => setFormData((prev) => ({ ...prev, visible: false }))}
            className="h-4 w-4 text-blue-600"
          />
          <EyeOff className="h-4 w-4 text-gray-400" />
          <span className="text-sm">Ocultar</span>
        </label>
      </div>
    </div>
  );
}
