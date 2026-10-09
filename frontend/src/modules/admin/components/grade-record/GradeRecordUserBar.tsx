import { Card, CardContent, Button } from '@/shared/components/ui';
import { GraduationCap, Printer } from 'lucide-react';
import type { UserGradesData, ProgramOption } from '../../hooks/useAdminGradeRecord';

interface GradeRecordUserBarProps {
  userGrades: UserGradesData | null | undefined;
  setSelectedUserId: (id: number | null) => void;
  setShowSearch: (show: boolean) => void;
  handlePrint: () => void;
  gradesLoading: boolean;
  programOptions: ProgramOption[];
  selectedProgramId: number | null;
  setSelectedProgramId: (id: number | null) => void;
}

export function GradeRecordUserBar({
  userGrades,
  setSelectedUserId,
  setShowSearch,
  handlePrint,
  gradesLoading,
  programOptions,
  selectedProgramId,
  setSelectedProgramId,
}: GradeRecordUserBarProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <GraduationCap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {userGrades?.user?.displayName || userGrades?.user?.email || 'Cargando...'}
              </p>
              <p className="text-sm text-gray-500">{userGrades?.user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm font-medium text-gray-700" htmlFor="record-program">
              Programa:
            </label>
            <select
              id="record-program"
              className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedProgramId ?? ''}
              onChange={(e) =>
                setSelectedProgramId(e.target.value === '' ? null : Number(e.target.value))
              }
              disabled={gradesLoading || programOptions.length === 0}
            >
              <option value="">Todos los programas</option>
              {programOptions.map((p) => (
                <option key={p.moodleId} value={p.moodleId}>
                  {p.name}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedUserId(null);
                setSelectedProgramId(null);
                setShowSearch(true);
              }}
            >
              Cambiar Usuario
            </Button>
            <Button onClick={handlePrint} disabled={gradesLoading}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Record
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
