import { Card, CardContent, Input, Badge } from '@/shared/components/ui';
import { Lock } from 'lucide-react';

export function TeacherGradeEntryLegend() {
  return (
    <Card className="mt-6">
      <CardContent className="p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Leyenda:</p>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Input disabled className="w-16 text-center h-8" placeholder="-" />
            <span>Campo editable</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <Lock className="h-3 w-3 mr-1" /> Editada
            </Badge>
            <span>Nota ya editada (bloqueada)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">90+</span>
            <span className="text-blue-600 font-medium">70-89</span>
            <span className="text-yellow-600 font-medium">60-69</span>
            <span className="text-red-600 font-medium">&lt;60</span>
            <span>Colores por porcentaje</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
