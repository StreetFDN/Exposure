"use client";

import * as React from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type SortDirection = "asc" | "desc" | null;

export interface DataTableColumn<T> {
  /** Unique key -- also used as the sort key if sortable */
  key: string;
  /** Column header label */
  header: string;
  /** Cell renderer */
  cell: (row: T, index: number) => React.ReactNode;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Optional header className */
  headerClassName?: string;
  /** Optional cell className */
  cellClassName?: string;
}

export interface DataTableProps<T> {
  /** Column configuration */
  columns: DataTableColumn<T>[];
  /** Row data */
  data: T[];
  /** Unique key extractor per row */
  rowKey: (row: T, index: number) => string | number;
  /** Whether the table is loading */
  isLoading?: boolean;
  /** Number of skeleton rows to show while loading */
  loadingRows?: number;
  /** Total number of items (for pagination) */
  totalItems?: number;
  /** Current page (1-indexed) */
  page?: number;
  /** Items per page */
  pageSize?: number;
  /** Page change handler */
  onPageChange?: (page: number) => void;
  /** Sort state */
  sortKey?: string | null;
  /** Sort direction */
  sortDirection?: SortDirection;
  /** Sort change handler */
  onSortChange?: (key: string, direction: SortDirection) => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Root className */
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

function DataTableInner<T>(
  {
    columns,
    data,
    rowKey,
    isLoading = false,
    loadingRows = 5,
    totalItems,
    page = 1,
    pageSize = 10,
    onPageChange,
    sortKey,
    sortDirection,
    onSortChange,
    emptyMessage = "No data found.",
    className,
  }: DataTableProps<T>,
  _ref: React.Ref<HTMLDivElement>
) {
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;
  const hasPagination = !!onPageChange && totalPages > 1;

  /* Sorting ---------------------------------------------------------------- */

  function handleSort(key: string) {
    if (!onSortChange) return;

    let nextDirection: SortDirection;
    if (sortKey !== key) {
      nextDirection = "asc";
    } else if (sortDirection === "asc") {
      nextDirection = "desc";
    } else {
      nextDirection = null;
    }
    onSortChange(key, nextDirection);
  }

  /* Pagination helpers ----------------------------------------------------- */

  function pageNumbers(): (number | "ellipsis")[] {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("ellipsis");

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (page < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }

    return pages;
  }

  /* Render ----------------------------------------------------------------- */

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  col.sortable && "cursor-pointer select-none",
                  col.headerClassName
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                aria-sort={
                  sortKey === col.key && sortDirection
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortKey === col.key && sortDirection && (
                    <span aria-hidden="true">
                      {sortDirection === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading
            ? Array.from({ length: loadingRows }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.cellClassName}>
                      <Skeleton variant="text" width="70%" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : data.length === 0
              ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={columns.length}
                      className="py-12 text-center text-zinc-500"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                )
              : data.map((row, idx) => (
                  <TableRow key={rowKey(row, idx)}>
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.cellClassName}>
                        {col.cell(row, idx)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {hasPagination && (
        <nav
          aria-label="Table pagination"
          className="flex items-center justify-between px-1"
        >
          <p className="text-xs text-zinc-500">
            Page {page} of {totalPages}
            {totalItems !== undefined && (
              <span className="ml-1">({totalItems} items)</span>
            )}
          </p>

          <div className="flex items-center gap-1">
            {/* Previous */}
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              aria-label="Go to previous page"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                page <= 1
                  ? "cursor-not-allowed text-zinc-300"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page numbers */}
            {pageNumbers().map((p, i) =>
              p === "ellipsis" ? (
                <span
                  key={`ellipsis-${i}`}
                  className="inline-flex h-8 w-8 items-center justify-center text-xs text-zinc-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange?.(p)}
                  aria-label={`Go to page ${p}`}
                  aria-current={p === page ? "page" : undefined}
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                    p === page
                      ? "bg-violet-600 text-white"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                >
                  {p}
                </button>
              )
            )}

            {/* Next */}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              aria-label="Go to next page"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                page >= totalPages
                  ? "cursor-not-allowed text-zinc-300"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

// Wrap with forwardRef while keeping generics via a cast
const DataTable = React.forwardRef(DataTableInner) as <T>(
  props: DataTableProps<T> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement | null;

export { DataTable };
