import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface Column<T> {
  header: string;
  accessor?: keyof T | string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  onRowClick,
  isLoading = false,
  emptyMessage = 'Tidak ada data ditemukan.',
  className,
}: DataTableProps<T>) {
  return (
    <div className={twMerge("w-full overflow-hidden border border-[#CBD5E1] rounded-xl shadow-sm bg-white", className)}>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1B3FAB] text-white text-sm font-semibold">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={twMerge(
                    "px-4 py-3 border-b border-[#CBD5E1] select-none whitespace-nowrap",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading state skeletons
              Array.from({ length: 3 }).map((_, rIdx) => (
                <tr key={rIdx} className="border-b border-[#CBD5E1] last:border-none animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-4">
                      <div className="h-4 bg-[#E2E8F0] rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-[#64748B]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              // Data rows
              data.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={twMerge(
                    clsx(
                      "text-sm border-b border-[#CBD5E1] last:border-none transition-colors",
                      rIdx % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]",
                      onRowClick ? "hover:bg-[#EFF6FF] cursor-pointer" : "hover:bg-[#F1F5F9]"
                    )
                  )}
                >
                  {columns.map((col, cIdx) => {
                    const cellValue = col.accessor
                      ? (row as any)[col.accessor]
                      : undefined;
                    return (
                      <td
                        key={cIdx}
                        className={twMerge(
                          "px-4 py-3 text-[#0F172A] align-middle whitespace-normal break-words",
                          col.className
                        )}
                      >
                        {col.render
                          ? col.render(cellValue, row, rIdx)
                          : cellValue !== undefined && cellValue !== null
                          ? String(cellValue)
                          : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
