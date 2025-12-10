type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const pagesAroundCurrent = Array.from(
    { length: Math.min(3, totalPages) },
    (_, i) => i + Math.max(currentPage - 1, 1),
  );

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-2 shadow-theme-xs dark:border-gray-700 dark:bg-gray-800">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/[0.03] dark:hover:text-white"
      >
        Previous
      </button>
      <div className="flex items-center gap-1.5">
        {currentPage > 3 && <span className="px-1 text-sm text-gray-400">...</span>}
        {pagesAroundCurrent.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${
              currentPage === page
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.05] dark:hover:text-white'
            }`}
          >
            {page}
          </button>
        ))}
        {currentPage < totalPages - 2 && <span className="px-1 text-sm text-gray-400">...</span>}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/[0.03] dark:hover:text-white"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
