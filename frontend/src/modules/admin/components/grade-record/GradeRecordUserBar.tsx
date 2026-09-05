import { Card, CardContent, Button } from '@/shared/components/ui';
import { GraduationCap, Printer } from 'lucide-react';
import type { UserGradesData } from '../../hooks/useAdminGradeRecord';

interface GradeRecordUserBarProps {
  userGrades: UserGradesData | null | undefined;
  setSelectedUserId: (id: number | null) => void;
  setShowSearch: (show: boolean) => void;
  handlePrint: () => void;
  gradesLoading: boolean;
}

export function GradeRecordUserBar({
  userGrades,
  setSelectedUserId,
  setShowSearch,
  handlePrint,
  gradesLoading,
}: GradeRecordUserBarProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedUserId(null);
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
