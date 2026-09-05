import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaymentsPaginationProps {
  page: number;
  totalPages: number;
  pageRange: (number | '...')[];
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function PaymentsPagination({
  page,
  totalPages,
  pageRange,
  total,
  limit,
  onPageChange,
}: PaymentsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 rounded-b-lg">
      <div className="text-sm text-gray-500">
        {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
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
              onClick={() => onPageChange(p as number)}
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
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
