import { Card, CardContent } from '@/shared/components/ui';
import { Clock, CheckCircle, XCircle, Send, BarChart3 } from 'lucide-react';

interface ReEnrolmentStatsData {
  submitted: number;
  approved: number;
  rejected: number;
  applied: number;
}

interface ReEnrolmentsStatsProps {
  stats: ReEnrolmentStatsData | null | undefined;
}

export function ReEnrolmentsStats({ stats }: ReEnrolmentsStatsProps) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.submitted || 0}</p>
          <p className="text-sm text-gray-500">Pendientes</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.approved || 0}</p>
          <p className="text-sm text-gray-500">Aprobadas</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.rejected || 0}</p>
          <p className="text-sm text-gray-500">Rechazadas</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Send className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.applied || 0}</p>
          <p className="text-sm text-gray-500">Aplicadas</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <BarChart3 className="h-5 w-5 text-gray-600" />
          </div>
          <p className="text-2xl font-bold text-gray-600">
            {(stats.submitted || 0) +
              (stats.approved || 0) +
              (stats.rejected || 0) +
              (stats.applied || 0)}
          </p>
          <p className="text-sm text-gray-500">Total</p>
        </CardContent>
      </Card>
    </div>
  );
}
