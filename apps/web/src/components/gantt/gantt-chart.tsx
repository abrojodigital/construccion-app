'use client';

import { useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Download, ChevronRight, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Types ─────────────────────────────────────────────────────────────────────

type GanttRowType = 'rubro' | 'tarea' | 'item';
type ViewMode = 'rubros' | 'tareas' | 'items';

interface GanttRow {
  id: string;
  name: string;
  type: GanttRowType;
  level: number;
  parentId: string | null;
  start: string | null;
  end: string | null;
  progress: number;
  status: string | null;
  dependencies: Array<{ id: string; type: string; lag: number }>;
  assignees: Array<{ id: string; firstName: string; lastName: string }>;
}

interface GanttChartProps {
  rows: GanttRow[];
  projectStart: string | null;
  projectEnd: string | null;
  projectName?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LABEL_W = 280;
const DAY_W = 28;
const ROW_H = 38;
const HEADER_H = 40;

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: '#22c55e',
  IN_PROGRESS: '#3b82f6',
  BLOCKED: '#ef4444',
  CANCELLED: '#9ca3af',
  PENDING: '#cbd5e1',
};

const TYPE_COLOR: Record<GanttRowType, string> = {
  rubro: '#f59e0b',
  tarea: '#6366f1',
  item: '#3b82f6',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const MS_DAY = 86_400_000;

function toDate(s: string | null): Date | null {
  return s ? new Date(s) : null;
}

function dayOffset(date: Date, base: Date): number {
  return Math.floor((date.getTime() - base.getTime()) / MS_DAY);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GanttChart({ rows, projectStart, projectEnd, projectName }: GanttChartProps) {
  const [view, setView] = useState<ViewMode>('items');
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Filter rows by view ──────────────────────────────────────────────────────
  const visibleRows = useMemo(() => {
    switch (view) {
      case 'rubros': return rows.filter((r) => r.type === 'rubro');
      case 'tareas': return rows.filter((r) => r.type === 'rubro' || r.type === 'tarea');
      default:       return rows;
    }
  }, [rows, view]);

  // ── Date range ───────────────────────────────────────────────────────────────
  const { startDate, totalDays } = useMemo(() => {
    const dates: Date[] = [];
    if (projectStart) dates.push(new Date(projectStart));
    if (projectEnd)   dates.push(new Date(projectEnd));
    visibleRows.forEach((r) => {
      if (r.start) dates.push(new Date(r.start));
      if (r.end)   dates.push(new Date(r.end));
    });

    if (dates.length === 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start, totalDays: 120 };
    }

    const min = new Date(Math.min(...dates.map((d) => d.getTime())) - 7 * MS_DAY);
    const max = new Date(Math.max(...dates.map((d) => d.getTime())) + 14 * MS_DAY);
    const days = Math.max(Math.ceil((max.getTime() - min.getTime()) / MS_DAY), 60);
    return { startDate: min, totalDays: days };
  }, [visibleRows, projectStart, projectEnd]);

  const chartWidth = totalDays * DAY_W;

  // ── Month headers ────────────────────────────────────────────────────────────
  const months = useMemo(() => {
    const result: Array<{ label: string; left: number; width: number }> = [];
    const endDate = new Date(startDate.getTime() + totalDays * MS_DAY);
    let cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (cur <= endDate) {
      const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
      const effStart = cur < startDate ? startDate : cur;
      const effEnd   = monthEnd > endDate ? endDate : monthEnd;

      const left  = Math.max(0, dayOffset(effStart, startDate)) * DAY_W;
      const width = Math.max(0, Math.ceil((effEnd.getTime() - effStart.getTime()) / MS_DAY)) * DAY_W;

      if (width > 0) {
        result.push({
          label: cur.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }),
          left,
          width,
        });
      }
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    return result;
  }, [startDate, totalDays]);

  // ── Bar positioning ───────────────────────────────────────────────────────────
  const getBar = (row: GanttRow) => {
    const s = toDate(row.start);
    const e = toDate(row.end) ?? s;
    if (!s) return null;

    const left  = dayOffset(s, startDate) * DAY_W;
    const width = Math.max(DAY_W, Math.ceil((e!.getTime() - s.getTime()) / MS_DAY) * DAY_W);
    return { left, width };
  };

  const getBarColor = (row: GanttRow) =>
    row.type !== 'item'
      ? TYPE_COLOR[row.type]
      : STATUS_COLOR[row.status ?? 'PENDING'] ?? STATUS_COLOR.PENDING;

  // ── Row styling ───────────────────────────────────────────────────────────────
  const rowBg = (row: GanttRow) => {
    if (row.type === 'rubro') return 'bg-amber-50 dark:bg-amber-950/20';
    if (row.type === 'tarea') return 'bg-indigo-50/40 dark:bg-indigo-950/10';
    return 'bg-background';
  };

  const rowText = (row: GanttRow) => {
    if (row.type === 'rubro') return 'font-semibold text-sm';
    if (row.type === 'tarea') return 'font-medium text-sm';
    return 'text-sm';
  };

  const indent = (row: GanttRow) => row.level * 14;

  // ── Today line ────────────────────────────────────────────────────────────────
  const today = new Date();
  const todayLeft = dayOffset(today, startDate) * DAY_W;
  const showToday = todayLeft >= 0 && todayLeft <= chartWidth;

  // ── PDF export ────────────────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  // ── Counts for view badge ────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    rubros: rows.filter((r) => r.type === 'rubro').length,
    tareas: rows.filter((r) => r.type === 'tarea').length,
    items:  rows.filter((r) => r.type === 'item').length,
  }), [rows]);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A3 landscape; margin: 8mm; }
          body > * { visibility: hidden; }
          #gantt-print-section, #gantt-print-section * { visibility: visible; }
          #gantt-print-section {
            position: absolute; left: 0; top: 0;
            width: 100%; overflow: visible !important;
          }
          .gantt-no-print { display: none !important; }
          .gantt-scroll-area { overflow: visible !important; }
          .gantt-inner-wrap { width: auto !important; min-width: unset !important; }
          .gantt-sticky-cell { position: relative !important; }
        }
      `}</style>

      {/* Controls */}
      <div className="gantt-no-print flex items-center justify-between mb-3 gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(
            [
              { key: 'rubros', label: 'Rubros', count: counts.rubros },
              { key: 'tareas', label: 'Tareas', count: counts.tareas },
              { key: 'items',  label: 'Ítems',  count: counts.items },
            ] as const
          ).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                view === key
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  view === key ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/20',
                )}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Download className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Print header (hidden on screen) */}
      <div className="hidden print:block mb-3">
        <p className="text-lg font-bold">{projectName} — Diagrama de Gantt</p>
        <p className="text-sm text-gray-500">
          Vista:{' '}
          {view === 'rubros' ? 'Rubros' : view === 'tareas' ? 'Tareas' : 'Ítems'}
        </p>
      </div>

      {/* Gantt */}
      <div id="gantt-print-section" className="border rounded-lg overflow-hidden">
        {/* Scrollable area */}
        <div className="gantt-scroll-area overflow-x-auto" ref={scrollRef}>
          <div
            className="gantt-inner-wrap"
            style={{ width: LABEL_W + chartWidth, minWidth: LABEL_W + chartWidth }}
          >
            {/* Month header row */}
            <div className="flex border-b bg-muted/70 sticky top-0 z-20">
              {/* Label column header */}
              <div
                className="gantt-sticky-cell sticky left-0 z-30 bg-muted/70 border-r px-3 flex items-center font-semibold text-xs uppercase tracking-wide text-muted-foreground shrink-0"
                style={{ width: LABEL_W, minWidth: LABEL_W, height: HEADER_H }}
              >
                Tarea
              </div>

              {/* Month labels */}
              <div
                style={{ width: chartWidth, position: 'relative', height: HEADER_H }}
              >
                {months.map((m, i) => (
                  <div
                    key={i}
                    className="absolute inset-y-0 flex items-center justify-center text-xs font-medium text-muted-foreground border-r border-border/50"
                    style={{ left: m.left, width: m.width }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div className="relative">
              {/* Today line */}
              {showToday && (
                <div
                  className="absolute top-0 bottom-0 z-20 pointer-events-none"
                  style={{
                    left: LABEL_W + todayLeft,
                    width: 1,
                    backgroundColor: '#ef4444',
                  }}
                />
              )}

              {visibleRows.length === 0 && (
                <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                  No hay datos para este nivel de vista.
                </div>
              )}

              {visibleRows.map((row) => {
                const bar = getBar(row);
                const color = getBarColor(row);
                const bg = rowBg(row);

                return (
                  <div
                    key={row.id}
                    className={cn('flex border-b transition-colors', bg)}
                    style={{ height: ROW_H }}
                  >
                    {/* ── Sticky label column ────────────────────────────────── */}
                    <div
                      className={cn(
                        'gantt-sticky-cell sticky left-0 z-10 shrink-0 border-r flex items-center gap-1 overflow-hidden',
                        bg,
                      )}
                      style={{
                        width: LABEL_W,
                        minWidth: LABEL_W,
                        paddingLeft: 8 + indent(row),
                        paddingRight: 8,
                      }}
                    >
                      {row.type === 'item' ? (
                        <Minus className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                      ) : (
                        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                      )}
                      <span
                        className={cn('truncate flex-1', rowText(row))}
                        title={row.name}
                      >
                        {row.name}
                      </span>
                      {row.progress > 0 && (
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {row.progress}%
                        </span>
                      )}
                    </div>

                    {/* ── Chart area ─────────────────────────────────────────── */}
                    <div style={{ width: chartWidth, position: 'relative' }}>
                      {/* Vertical grid (month boundaries) */}
                      {months.map((m, i) => (
                        <div
                          key={i}
                          className="absolute inset-y-0 border-r border-border/20 pointer-events-none"
                          style={{ left: m.left + m.width }}
                        />
                      ))}

                      {/* Bar */}
                      {bar && (
                        <div
                          className="absolute rounded-sm overflow-hidden"
                          style={{
                            left: bar.left,
                            width: bar.width,
                            top: 6,
                            height: ROW_H - 12,
                            backgroundColor: color,
                            opacity: row.type === 'item' ? 0.82 : 0.72,
                          }}
                        >
                          {/* Progress overlay */}
                          {row.progress > 0 && (
                            <div
                              className="absolute inset-0 bg-black/25"
                              style={{ width: `${row.progress}%` }}
                            />
                          )}
                          {bar.width > 48 && (
                            <span className="absolute inset-0 flex items-center px-2 text-xs text-white font-medium">
                              {row.progress}%
                            </span>
                          )}
                        </div>
                      )}

                      {!bar && (
                        <div className="absolute inset-0 flex items-center px-3">
                          <span className="text-xs text-muted-foreground/40 italic">
                            Sin fechas
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="gantt-no-print flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Referencia:</span>
        {[
          { color: TYPE_COLOR.rubro,     label: 'Rubro' },
          { color: TYPE_COLOR.tarea,     label: 'Tarea' },
          { color: STATUS_COLOR.PENDING,    label: 'Ítem pendiente' },
          { color: STATUS_COLOR.IN_PROGRESS, label: 'En progreso' },
          { color: STATUS_COLOR.COMPLETED,   label: 'Completado' },
          { color: STATUS_COLOR.BLOCKED,     label: 'Bloqueado' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-px h-4 bg-red-500" />
          Hoy
        </span>
      </div>
    </div>
  );
}
