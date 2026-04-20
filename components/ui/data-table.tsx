// @task S7FE4 — Composite: DataTable
// 기반: S7FE1 토큰 + TanStack Table v8 (@tanstack/react-table)
// 기능: 정렬(sorting) / 필터(globalFilter) / 페이지네이션
// - ColumnDef generic 지원
// - Semantic 토큰만 소비 (surface-1/2, border-subtle/default, text-primary/secondary)
// - 빈 상태 플레이스홀더 (EmptyState 연계)
// 'use client' 필수 (TanStack Table hook 사용)

'use client';

import * as React from 'react';
/* TODO: npm install @tanstack/react-table */
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';

/* ──────────────────────────────────────────────────────────────────────
   §1. 아이콘 (inline SVG — lucide 없어도 작동)
   ────────────────────────────────────────────────────────────────────── */

function SortAscIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('h-3.5 w-3.5', className)}
    >
      <path d="M8 3v10M4 7l4-4 4 4" />
    </svg>
  );
}

function SortDescIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('h-3.5 w-3.5', className)}
    >
      <path d="M8 3v10M4 9l4 4 4-4" />
    </svg>
  );
}

function SortDefaultIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('h-3.5 w-3.5 opacity-40', className)}
    >
      <path d="M8 2v12M5 5l3-3 3 3M5 11l3 3 3-3" />
    </svg>
  );
}

function ChevronIcon({
  direction,
  className,
}: {
  direction: 'left' | 'right';
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('h-4 w-4', className)}
    >
      {direction === 'left' ? (
        <path d="M10 4L6 8l4 4" />
      ) : (
        <path d="M6 4l4 4-4 4" />
      )}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   §2. 필터 입력 (글로벌 검색)
   ────────────────────────────────────────────────────────────────────── */

interface GlobalFilterInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function GlobalFilterInput({
  value,
  onChange,
  placeholder = '검색...',
  className,
}: GlobalFilterInputProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'h-9 w-full max-w-xs rounded-md border border-border-default bg-surface-2',
        'px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary',
        'focus:outline-none focus:ring-2 focus:ring-ring-focus focus:ring-offset-1',
        'focus:ring-offset-surface-0',
        'transition-colors duration-200',
        className
      )}
      aria-label={placeholder}
    />
  );
}

/* ──────────────────────────────────────────────────────────────────────
   §3. 페이지네이션 버튼
   ────────────────────────────────────────────────────────────────────── */

interface PaginationButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

function PaginationButton({
  children,
  active,
  className,
  ...props
}: PaginationButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2',
        'text-sm font-medium transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus',
        'disabled:pointer-events-none disabled:opacity-40',
        active
          ? 'bg-interactive-primary text-text-inverted'
          : 'bg-surface-1 text-text-secondary hover:bg-interactive-secondary-hover hover:text-text-primary',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   §4. DataTable props
   ────────────────────────────────────────────────────────────────────── */

export interface DataTableProps<TData> {
  /** TanStack Table ColumnDef 배열 */
  columns: ColumnDef<TData>[];
  /** 행 데이터 배열 */
  data: TData[];
  /** 전역 검색 플레이스홀더 */
  filterPlaceholder?: string;
  /** 전역 검색 비활성화 */
  disableFilter?: boolean;
  /** 정렬 비활성화 */
  disableSorting?: boolean;
  /** 페이지네이션 비활성화 */
  disablePagination?: boolean;
  /** 기본 페이지 크기 */
  defaultPageSize?: number;
  /** 빈 상태 메시지 */
  emptyMessage?: React.ReactNode;
  /** 테이블 전체 감싸는 className */
  className?: string;
}

/* ──────────────────────────────────────────────────────────────────────
   §5. DataTable 본체
   ────────────────────────────────────────────────────────────────────── */

export function DataTable<TData>({
  columns,
  data,
  filterPlaceholder,
  disableFilter = false,
  disableSorting = false,
  disablePagination = false,
  defaultPageSize = 10,
  emptyMessage,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: disableSorting ? undefined : getSortedRowModel(),
    getFilteredRowModel: disableFilter ? undefined : getFilteredRowModel(),
    getPaginationRowModel: disablePagination ? undefined : getPaginationRowModel(),
  });

  const { pageIndex, pageSize } = pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const totalPages = Math.ceil(totalRows / pageSize);
  const hasRows = table.getRowModel().rows.length > 0;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* ── 필터 툴바 ── */}
      {!disableFilter && (
        <div className="flex items-center justify-between gap-2">
          <GlobalFilterInput
            value={globalFilter}
            onChange={setGlobalFilter}
            placeholder={filterPlaceholder}
          />
          {!disablePagination && (
            <p className="shrink-0 text-xs text-text-tertiary">
              {totalRows.toLocaleString()}건
            </p>
          )}
        </div>
      )}

      {/* ── 테이블 ── */}
      <div className="overflow-x-auto rounded-lg border border-border-default">
        <table className="w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-surface-1 border-b border-border-default"
              >
                {headerGroup.headers.map((header) => {
                  const canSort = !disableSorting && header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className={cn(
                        'px-4 py-3 text-left font-semibold text-text-secondary',
                        '[word-break:keep-all]',
                        canSort && 'cursor-pointer select-none hover:text-text-primary'
                      )}
                      onClick={
                        canSort ? header.column.getToggleSortingHandler() : undefined
                      }
                      aria-sort={
                        sorted === 'asc'
                          ? 'ascending'
                          : sorted === 'desc'
                          ? 'descending'
                          : canSort
                          ? 'none'
                          : undefined
                      }
                    >
                      {header.isPlaceholder ? null : (
                        <span className="inline-flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {canSort && (
                            <span aria-hidden="true">
                              {sorted === 'asc' ? (
                                <SortAscIcon />
                              ) : sorted === 'desc' ? (
                                <SortDescIcon />
                              ) : (
                                <SortDefaultIcon />
                              )}
                            </span>
                          )}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {hasRows ? (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-border-subtle transition-colors duration-100',
                    i % 2 === 0 ? 'bg-surface-2' : 'bg-surface-1',
                    'hover:bg-interactive-secondary'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-text-primary [word-break:keep-all]"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-text-tertiary"
                >
                  {emptyMessage ?? (
                    <span className="text-sm [word-break:keep-all]">
                      {globalFilter ? '검색 결과가 없습니다.' : '데이터가 없습니다.'}
                    </span>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── 페이지네이션 ── */}
      {!disablePagination && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-text-tertiary">
            {pageIndex * pageSize + 1}–
            {Math.min((pageIndex + 1) * pageSize, totalRows)} / {totalRows.toLocaleString()}
          </p>
          <div className="flex items-center gap-1" role="navigation" aria-label="페이지 이동">
            <PaginationButton
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="이전 페이지"
            >
              <ChevronIcon direction="left" />
            </PaginationButton>

            {/* 페이지 번호 — 최대 7개 노출 */}
            {buildPageRange(pageIndex, totalPages).map((p, i) =>
              p === -1 ? (
                <span key={`ellipsis-${i}`} className="px-1 text-text-tertiary text-xs">
                  …
                </span>
              ) : (
                <PaginationButton
                  key={p}
                  active={p === pageIndex}
                  onClick={() => table.setPageIndex(p)}
                  aria-label={`${p + 1} 페이지`}
                  aria-current={p === pageIndex ? 'page' : undefined}
                >
                  {p + 1}
                </PaginationButton>
              )
            )}

            <PaginationButton
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="다음 페이지"
            >
              <ChevronIcon direction="right" />
            </PaginationButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   §6. 페이지 범위 계산 유틸
   ────────────────────────────────────────────────────────────────────── */

/** 노출할 페이지 인덱스 배열 생성. -1은 생략 기호(…). */
function buildPageRange(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }
  const pages: (number | -1)[] = [];
  pages.push(0);
  if (current > 3) pages.push(-1);
  for (
    let i = Math.max(1, current - 2);
    i <= Math.min(total - 2, current + 2);
    i++
  ) {
    pages.push(i);
  }
  if (current < total - 4) pages.push(-1);
  pages.push(total - 1);
  return pages;
}

// Re-export ColumnDef for convenience
export type { ColumnDef };
