'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TASK_STATUS_COLORS } from '@construccion/shared';

interface GanttTask {
  id: string;
  name: string;
  start: string | null;
  end: string | null;
  progress: number;
  status: string;
  stageId: string;
  stageName: string;
  dependencies: Array<{ id: string; type: string; lag: number }>;
}

interface GanttChartProps {
  tasks: GanttTask[];
  projectStart: string | null;
  projectEnd: string | null;
}

export function GanttChart({ tasks, projectStart, projectEnd }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate date range
  const { startDate, endDate, totalDays, dayWidth } = useMemo(() => {
    const taskDates = tasks
      .filter((t) => t.start)
      .map((t) => ({
        start: new Date(t.start!),
        end: t.end ? new Date(t.end) : new Date(t.start!),
      }));

    let start = projectStart ? new Date(projectStart) : new Date();
    let end = projectEnd ? new Date(projectEnd) : new Date();

    taskDates.forEach(({ start: ts, end: te }) => {
      if (ts < start) start = ts;
      if (te > end) end = te;
    });

    // Add padding
    start = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
    end = new Date(end.getTime() + 7 * 24 * 60 * 60 * 1000);

    const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const chartWidth = Math.max(containerWidth - 250, 800);
    const width = Math.max(chartWidth / days, 20);

    return {
      startDate: start,
      endDate: end,
      totalDays: days,
      dayWidth: width,
    };
  }, [tasks, projectStart, projectEnd, containerWidth]);

  // Generate month headers
  const months = useMemo(() => {
    const result: Array<{ label: string; width: number; offset: number }> = [];
    let current = new Date(startDate);
    current.setDate(1);

    while (current <= endDate) {
      const monthStart = new Date(current);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

      const effectiveStart = monthStart < startDate ? startDate : monthStart;
      const effectiveEnd = monthEnd > endDate ? endDate : monthEnd;

      const daysInView = Math.ceil(
        (effectiveEnd.getTime() - effectiveStart.getTime()) / (24 * 60 * 60 * 1000)
      );

      const offset = Math.floor(
        (effectiveStart.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
      );

      result.push({
        label: current.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }),
        width: daysInView * dayWidth,
        offset: offset * dayWidth,
      });

      current.setMonth(current.getMonth() + 1);
    }

    return result;
  }, [startDate, endDate, dayWidth]);

  // Calculate task position
  const getTaskPosition = (task: GanttTask) => {
    if (!task.start) return null;

    const taskStart = new Date(task.start);
    const taskEnd = task.end ? new Date(task.end) : new Date(task.start);

    const startOffset = Math.floor(
      (taskStart.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
    );
    const duration = Math.max(
      1,
      Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (24 * 60 * 60 * 1000))
    );

    return {
      left: startOffset * dayWidth,
      width: duration * dayWidth,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500';
      case 'IN_PROGRESS':
        return 'bg-blue-500';
      case 'BLOCKED':
        return 'bg-red-500';
      case 'CANCELLED':
        return 'bg-gray-400';
      default:
        return 'bg-gray-300';
    }
  };

  const chartWidth = totalDays * dayWidth;
  const rowHeight = 40;

  return (
    <div ref={containerRef} className="overflow-x-auto">
      <div className="min-w-[800px]" style={{ width: chartWidth + 250 }}>
        {/* Header */}
        <div className="flex border-b">
          <div className="w-[250px] flex-shrink-0 p-2 font-medium bg-muted/50">Tarea</div>
          <div className="flex-1 relative" style={{ width: chartWidth }}>
            {/* Month headers */}
            <div className="flex border-b h-8">
              {months.map((month, i) => (
                <div
                  key={i}
                  className="text-xs font-medium text-center border-r bg-muted/30 flex items-center justify-center"
                  style={{
                    width: month.width,
                    position: 'absolute',
                    left: month.offset,
                  }}
                >
                  {month.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today line */}
        {(() => {
          const today = new Date();
          if (today >= startDate && today <= endDate) {
            const offset = Math.floor(
              (today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
            );
            return (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                style={{ left: 250 + offset * dayWidth }}
              />
            );
          }
          return null;
        })()}

        {/* Task rows */}
        <div className="relative">
          {tasks.map((task, index) => {
            const position = getTaskPosition(task);

            return (
              <div
                key={task.id}
                className="flex border-b hover:bg-muted/30 transition-colors"
                style={{ height: rowHeight }}
              >
                {/* Task name */}
                <div className="w-[250px] flex-shrink-0 p-2 flex items-center gap-2 truncate">
                  <span className="text-xs text-muted-foreground">{task.stageName}</span>
                  <span className="truncate text-sm">{task.name}</span>
                </div>

                {/* Task bar */}
                <div className="flex-1 relative" style={{ width: chartWidth }}>
                  {position && (
                    <div
                      className={cn(
                        'absolute top-2 h-6 rounded flex items-center overflow-hidden',
                        getStatusColor(task.status)
                      )}
                      style={{
                        left: position.left,
                        width: Math.max(position.width, 20),
                      }}
                    >
                      {/* Progress bar */}
                      <div
                        className="absolute inset-0 bg-black/20"
                        style={{ width: `${task.progress}%` }}
                      />
                      {position.width > 60 && (
                        <span className="relative z-10 px-2 text-xs text-white font-medium truncate">
                          {task.progress}%
                        </span>
                      )}
                    </div>
                  )}

                  {!position && (
                    <div className="absolute top-2 left-2 text-xs text-muted-foreground italic">
                      Sin fechas
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 p-4 border-t bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-300" />
            <span className="text-xs">Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-xs">En Progreso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-xs">Completada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-xs">Bloqueada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-red-500" />
            <span className="text-xs">Hoy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
