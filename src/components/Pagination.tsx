'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  function getPages(): (number | string)[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  }

  const pages = getPages();

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: '#e2e8f0', color: '#475569' }}
      >
        <i className="fas fa-chevron-left mr-1 text-[10px]"></i>Prev
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-xs text-gray-400">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className="min-w-[32px] px-2 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: currentPage === p ? '#0f1a3c' : '#e2e8f0',
              color: currentPage === p ? '#fff' : '#475569',
            }}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: '#e2e8f0', color: '#475569' }}
      >
        Next<i className="fas fa-chevron-right ml-1 text-[10px]"></i>
      </button>
    </div>
  );
}
