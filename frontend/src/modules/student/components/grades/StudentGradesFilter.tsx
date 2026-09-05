import { Card, CardContent, Label, Select, Spinner } from '@/shared/components/ui';
import { GraduationCap } from 'lucide-react';

interface StudentGradesFilterProps {
  selectedPeriodId: number | null;
  setSelectedPeriodId: (id: number | null) => void;
  myPeriods?: { periodId: number; periodName: string }[];
  periodsLoading: boolean;
}

export function StudentGradesFilter({
  selectedPeriodId,
  setSelectedPeriodId,
  myPeriods,
  periodsLoading,
}: StudentGradesFilterProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-end gap-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-gray-500" />
            <div className="min-w-[200px]">
              <Label>Período académico</Label>
              {periodsLoading ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Select
                  value={selectedPeriodId || ''}
                  onChange={(e) => setSelectedPeriodId(Number(e.target.value) || null)}
                  className="mt-1"
                >
                  <option value="">Todos los períodos</option>
                  {myPeriods?.map((period) => (
                    <option key={period.periodId} value={period.periodId}>
                      {period.periodName}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
