import { Card, CardContent, Badge, Spinner } from '@/shared/components/ui';
import { Mail, CheckCircle, AlertCircle, Pencil, UserRound, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib';
import type { NavigateFunction } from 'react-router-dom';
import { PAGE_SIZE } from '../../hooks/useSettingsProfesores';
import type { UsersResponse } from '../../hooks/useSettingsProfesores';

interface TeachersTableProps {
  data?: UsersResponse;
  isLoading: boolean;
  page: number;
  setPage: (val: number | ((prev: number) => number)) => void;
  totalPages: number;
  pageRange: (number | '...')[];
  search: string;
  navigate: NavigateFunction;
}

export function TeachersTable({
  data,
  isLoading,
  page,
  setPage,
  totalPages,
  pageRange,
  search,
  navigate,
}: TeachersTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : data?.users && data.users.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Profesor</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Moodle</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Registrado</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data.users.map((teacher) => (
                    <tr
                      key={teacher.id}
                      className="hover:bg-violet-50/40 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/settings/profesores/${teacher.id}/editar`)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 h-9 w-9 rounded-full bg-violet-100 flex items-center justify-center">
                            <span className="text-violet-700 font-semibold text-sm">
                              {teacher.displayName?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{teacher.displayName || '—'}</p>
                            <p className="text-xs text-gray-400">ID: {teacher.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{teacher.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {teacher.moodleUserId ? (
                          <div className="flex items-center gap-1.5 text-sm text-emerald-600">
                            <CheckCircle className="h-4 w-4 shrink-0" />
                            <span className="font-medium">ID {teacher.moodleUserId}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-sm text-amber-500">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>Sin vincular</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={teacher.isActive ? 'success' : 'danger'}>
                          {teacher.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-400 hidden lg:table-cell whitespace-nowrap">
                        {new Date(teacher.createdAt).toLocaleDateString('es-DO')}
                      </td>
                      <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/admin/settings/profesores/${teacher.id}/editar`)}
                          title="Editar"
                          className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                <span className="text-sm text-gray-400">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.total)} de {data.total}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {pageRange.map((p, i) =>
                    p === '...' ? (
                      <span key={`e-${i}`} className="px-1 text-gray-400 text-sm">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={cn(
                          'min-w-[32px] h-8 rounded-md text-sm font-medium border transition-colors',
                          page === p ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-600 hover:bg-white',
                        )}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <UserRound className="h-12 w-12 mb-3 text-gray-200" />
            <p className="text-base font-medium text-gray-500">No hay profesores registrados</p>
            <p className="text-sm mt-1">
              {search ? 'Intenta con otro término de búsqueda' : 'Crea el primer profesor con el botón "Nuevo Profesor"'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
