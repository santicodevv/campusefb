import { Card, CardContent, Badge, Spinner, Button } from '@/shared/components/ui';
import {
  QrCode,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import type { Transcript } from '../../hooks/useAdminTranscripts';

interface TranscriptsTableProps {
  isLoading: boolean;
  transcripts?: Transcript[];
  total?: number;
  page: number;
  limit: number;
  totalPages: number;
  setPage: (page: number) => void;
  onDownload: (transcript: Transcript) => void;
  onRevoke: (transcript: Transcript) => void;
}

export function TranscriptsTable({
  isLoading,
  transcripts,
  total,
  page,
  limit,
  totalPages,
  setPage,
  onDownload,
  onRevoke,
}: TranscriptsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : transcripts && transcripts.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Número
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estudiante
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Período
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha Generación
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transcripts.map((transcript) => (
                    <tr key={transcript.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-gray-400" />
                          <span className="font-mono text-sm">
                            {transcript.transcriptNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-sm">
                              {transcript.student?.displayName || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500">{transcript.student?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {transcript.period ? (
                          <Badge variant="secondary">{transcript.period.code}</Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">Todos</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={transcript.status === 'generated' ? 'success' : 'danger'}>
                          {transcript.status === 'generated' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Activa
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Revocada
                            </>
                          )}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {new Date(transcript.generatedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDownload(transcript)}
                            disabled={transcript.status === 'revoked'}
                            title="Descargar PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {transcript.status === 'generated' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRevoke(transcript)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Revocar"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && total !== undefined && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-gray-600">
                  Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mb-4 text-gray-300" />
            <p>No hay constancias generadas</p>
            <p className="text-sm">Genera una nueva constancia para un estudiante</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
