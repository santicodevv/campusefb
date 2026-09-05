import { Card, CardContent, Label, Select } from '@/shared/components/ui';
import { GraduationCap } from 'lucide-react';
import type { AcademicPeriod } from '@/shared/types';

interface AdminGradesPeriodSelectorProps {
  effectivePeriodId: number | undefined;
  handlePeriodChange: (id: number | null) => void;
  periods: AcademicPeriod[] | undefined;
}

export function AdminGradesPeriodSelector({
  effectivePeriodId,
  handlePeriodChange,
  periods,
}: AdminGradesPeriodSelectorProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <GraduationCap className="h-5 w-5 text-gray-500" />
          <div className="flex-1 max-w-xs">
            <Label>Período Académico</Label>
            <Select
              value={effectivePeriodId || ''}
              onChange={(e) => handlePeriodChange(Number(e.target.value) || null)}
              className="mt-1"
            >
              <option value="">-- Selecciona un período --</option>
              {periods?.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name} {period.status === 'open' ? '(Actual)' : ''}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
