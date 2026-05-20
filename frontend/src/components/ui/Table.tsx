import { useState } from 'react';
import type { ReactNode } from 'react';

export interface ColumnDef<T> {
  key:        string;
  header:     string;
  sortable?:  boolean;
  width?:     string;
  render:     (row: T, index: number) => ReactNode;
  sortValue?: (row: T) => any;
}

interface TableProps<T> {
  columns:       ColumnDef<T>[];
  rows:          T[];
  rowKey:        (row: T) => string;
  onRowClick?:   (row: T) => void;
  emptyMessage?: string;
  className?:    string;
  stickyHeader?: boolean;
}

type SortDir = 'asc' | 'desc';

export default function Table<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyMessage = 'No records found.',
  className    = '',
  stickyHeader = false,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sortedRows = (() => {
    const getRecentlyAddedRows = () => {
      return [...rows].sort((a, b) => {
        const ad = (a as any).created_at ? new Date((a as any).created_at).getTime() : 0;
        const bd = (b as any).created_at ? new Date((b as any).created_at).getTime() : 0;
        if (ad === bd) return 0;
        return bd - ad;
      });
    };

    if (!sortKey) return getRecentlyAddedRows();
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortable) return getRecentlyAddedRows();
    return [...rows].sort((a, b) => {
      const av = col.sortValue ? col.sortValue(a) : (a as Record<string, unknown>)[sortKey];
      const bv = col.sortValue ? col.sortValue(b) : (b as Record<string, unknown>)[sortKey];
      const as = av == null ? '' : String(av).toLowerCase();
      const bs = bv == null ? '' : String(bv).toLowerCase();
      const n  = av !== '' && bv !== '' && !isNaN(Number(av)) && !isNaN(Number(bv));
      const cmp = n ? Number(av) - Number(bv) : as.localeCompare(bs);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  })();

  return (
    <div className={['overflow-x-auto', className].join(' ')} style={{ background: 'transparent' }}>
      <table className="min-w-full">
        <thead
          className={stickyHeader ? 'sticky top-0 z-10' : ''}
          style={{
            background: 'rgba(255, 255, 255, 0.45)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <tr style={{ borderBottom: '1px solid rgba(226, 232, 240, 0.7)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className={[
                  'px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide select-none',
                  col.sortable ? 'cursor-pointer hover:text-ink transition-colors duration-150' : '',
                ].join(' ')}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="inline-flex flex-col gap-px shrink-0">
                      <svg
                        width="8"
                        height="5"
                        viewBox="0 0 8 5"
                        fill="none"
                        className={
                          sortKey === col.key && sortDir === 'asc'
                            ? 'text-brand-500'
                            : 'text-ink-faint'
                        }
                      >
                        <path d="M4 0L8 5H0L4 0Z" fill="currentColor" />
                      </svg>
                      <svg
                        width="8"
                        height="5"
                        viewBox="0 0 8 5"
                        fill="none"
                        className={
                          sortKey === col.key && sortDir === 'desc'
                            ? 'text-brand-500'
                            : 'text-ink-faint'
                        }
                      >
                        <path d="M4 5L0 0H8L4 5Z" fill="currentColor" />
                      </svg>
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedRows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm text-ink-faint"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedRows.map((row, i) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={[
                  'transition-colors duration-100',
                  onRowClick ? 'cursor-pointer hover:bg-white/20' : 'hover:bg-white/10',
                ].join(' ')}
                style={{ borderBottom: '1px solid rgba(226, 232, 240, 0.5)' }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-sm text-ink"
                  >
                    {col.render(row, i)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}