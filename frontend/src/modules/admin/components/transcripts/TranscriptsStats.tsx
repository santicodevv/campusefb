import { Card, CardContent } from '@/shared/components/ui';
import { CheckCircle, XCircle, FileText } from 'lucide-react';
import type { Transcript } from '../../hooks/useAdminTranscripts';

interface TranscriptsStatsProps {
  transcripts?: Transcript[];
  total?: number;
}

export function TranscriptsStats({ transcripts, total }: TranscriptsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Constancias Activas</p>
              <p className="text-xl font-bold text-green-600">
                {transcripts?.filter((t) => t.status === 'generated').length ?? 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Revocadas</p>
              <p className="text-xl font-bold text-red-600">
                {transcripts?.filter((t) => t.status === 'revoked').length ?? 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Generadas</p>
              <p className="text-xl font-bold text-blue-600">{total ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
