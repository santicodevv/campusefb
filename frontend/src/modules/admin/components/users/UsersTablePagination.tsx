import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS, getPageSizeLabel } from '../../hooks/useUsersTable';

interface UsersTablePaginationProps {
  total: number;
  limit: number;
  setLimit: (limit: number) => void;
  page: number;
  setPage: (page: number | ((p: number) => number)) => void;
  totalPages: number;
  pageRange: (number | '...')[];
  jumpInput: string;
  setJumpInput: (val: string) => void;
  handleJumpPage: () => void;
}

export function UsersTablePagination({
  total, limit, setLimit, page, setPage, totalPages, pageRange,
  jumpInput, setJumpInput, handleJumpPage
}: UsersTablePaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-gray-50">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>Filas por página:</span>
        <select
          value={limit}
          onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
          className="border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>{getPageSizeLabel(s)}</option>
          ))}
        </select>
        {limit === 0 ? (
          <span>Mostrando todos ({total})</span>
        ) : (
          <span>
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
          </span>
        )}
      </div>

      {limit > 0 && totalPages > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          <button
            onClick={() => setPage((p: number) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageRange.map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm">…</span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className={`min-w-[32px] h-8 rounded-md text-sm font-medium border transition-colors ${
                  page === p
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-600 hover:bg-white'
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {totalPages > 5 && (
            <div className="flex items-center gap-1 ml-2 text-sm text-gray-500">
              <span>Ir a:</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJumpPage()}
                className="w-14 border border-gray-200 rounded-md px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Pág."
              />
              <button
                onClick={handleJumpPage}
                className="px-2 py-1 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
