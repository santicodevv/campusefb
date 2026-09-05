import { Label, Input } from '@/shared/components/ui';
import { Calendar } from 'lucide-react';
import type { CreateCourseDto } from '@/shared/types';

interface CourseDateFieldsProps {
  formData: CreateCourseDto;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  enableEndDate: boolean;
  setEnableEndDate: (val: boolean) => void;
}

export function CourseDateFields({ formData, handleInputChange, enableEndDate, setEnableEndDate }: CourseDateFieldsProps) {
  return (
    <>
      <div>
        <Label htmlFor="startdate">
          <Calendar className="h-4 w-4 inline mr-1" />
          Fecha de inicio del curso <span className="text-red-500">*</span>
        </Label>
        <Input
          id="startdate"
          name="startdate"
          type="datetime-local"
          value={formData.startdate}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            id="enableEndDate"
            checked={enableEndDate}
            onChange={(e) => setEnableEndDate(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <Label htmlFor="enableEndDate" className="mb-0">
            <Calendar className="h-4 w-4 inline mr-1" />
            Habilitar fecha de finalizacion
          </Label>
        </div>
        {enableEndDate && (
          <Input
            id="enddate"
            name="enddate"
            type="datetime-local"
            value={formData.enddate || ''}
            onChange={handleInputChange}
          />
        )}
      </div>
    </>
  );
}
