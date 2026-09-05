import { Label, Select, Spinner } from '@/shared/components/ui';
import { UserCheck, X } from 'lucide-react';

interface TeacherOption {
  id: number;
  email: string;
  displayName: string | null;
}

interface CourseTeachersFieldProps {
  teachers: TeacherOption[] | undefined;
  teachersLoading: boolean;
  selectedTeacherIds: number[];
  setSelectedTeacherIds: React.Dispatch<React.SetStateAction<number[]>>;
}

export function CourseTeachersField({
  teachers,
  teachersLoading,
  selectedTeacherIds,
  setSelectedTeacherIds,
}: CourseTeachersFieldProps) {
  return (
    <div>
      <Label>
        <UserCheck className="h-4 w-4 inline mr-1" />
        Profesores (opcional)
      </Label>
      {teachersLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Spinner className="h-4 w-4" />
          <span className="text-sm text-gray-500">Cargando profesores...</span>
        </div>
      ) : teachers && teachers.length > 0 ? (
        <div className="space-y-2">
          <Select
            onChange={(e) => {
              const teacherId = Number(e.target.value);
              if (teacherId && !selectedTeacherIds.includes(teacherId)) {
                setSelectedTeacherIds((prev) => [...prev, teacherId]);
              }
              e.target.value = '';
            }}
          >
            <option value="">Seleccionar profesor...</option>
            {teachers
              .filter((t) => !selectedTeacherIds.includes(t.id))
              .map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.displayName || teacher.email}
                </option>
              ))}
          </Select>
          {/* Selected teachers list */}
          {selectedTeacherIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTeacherIds.map((teacherId) => {
                const teacher = teachers.find((t) => t.id === teacherId);
                return (
                  <span
                    key={teacherId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {teacher?.displayName || teacher?.email}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedTeacherIds((prev) =>
                          prev.filter((id) => id !== teacherId)
                        )
                      }
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
          No hay profesores disponibles.
        </div>
      )}
      <p className="text-xs text-gray-500 mt-1">
        Asigna profesores al curso (puedes agregar más después)
      </p>
    </div>
  );
}
