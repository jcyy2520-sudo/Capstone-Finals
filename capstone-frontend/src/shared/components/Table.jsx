import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

const getNestedValue = (item, accessorKey) => {
  if (!accessorKey) {
    return undefined;
  }

  return accessorKey.split('.').reduce((value, key) => {
    if (value === null || value === undefined) {
      return undefined;
    }

    return value[key];
  }, item);
};

const renderHeader = (column) => {
  if (typeof column.header === 'function') {
    return column.header({ column });
  }

  return column.header ?? column.accessorKey ?? '';
};

const Table = ({ columns = [], data = [], loading = false, pagination, onPageChange }) => {
  const currentPage = pagination?.current_page ?? 1;
  const lastPage = pagination?.last_page ?? 1;
  const perPage = pagination?.per_page ?? (data.length || 1);
  const total = pagination?.total ?? data.length;
  const from = pagination?.from ?? (total > 0 ? (currentPage - 1) * perPage + 1 : 0);
  const to = pagination?.to ?? (total > 0 ? Math.min(from + data.length - 1, total) : 0);
  const canGoPrevious = Boolean(onPageChange) && currentPage > 1;
  const canGoNext = Boolean(onPageChange) && currentPage < lastPage;

  const handlePageChange = (page) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.id ?? column.accessorKey ?? index}
                  className="px-4 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider"
                >
                  {renderHeader(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={Math.max(columns.length, 1)} className="text-center py-3">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={Math.max(columns.length, 1)} className="text-center py-3 text-[13px] text-gray-500">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={row.id ?? rowIndex}>
                  {columns.map((column, columnIndex) => {
                    const value = getNestedValue(row, column.accessorKey);
                    const content = typeof column.cell === 'function'
                      ? column.cell({
                          row: { original: row, index: rowIndex },
                          column,
                          getValue: () => value,
                        })
                      : value ?? '';

                    return (
                      <td
                        key={column.id ?? column.accessorKey ?? columnIndex}
                        className="px-4 py-2.5 whitespace-nowrap text-[13px] text-gray-600"
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && total > perPage && (
        <div className="py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button onClick={() => handlePageChange(currentPage - 1)} disabled={!canGoPrevious}>
              Previous
            </Button>
            <Button onClick={() => handlePageChange(currentPage + 1)} disabled={!canGoNext}>
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] text-gray-700">
                Showing <span className="font-medium">{from}</span> to <span className="font-medium">{to}</span> of{' '}
                <span className="font-medium">{total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!canGoPrevious}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!canGoNext}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Table;
