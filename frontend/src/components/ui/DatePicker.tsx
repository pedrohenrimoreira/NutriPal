/**
 * components/ui/DatePicker.tsx – Liquid glass calendar (Amy-inspired).
 *
 * Compact calendar that drops down from the "Today" pill.
 * Shows month grid with dots on days that have entries.
 */

import { useState, useMemo } from 'react';

interface DatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  daysWithEntries?: Set<string>; // set of YYYY-MM-DD
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isSameDay(a: string, b: string): boolean {
  return a === b;
}

export function DatePicker({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  daysWithEntries = new Set(),
}: DatePickerProps) {
  const selected = new Date(selectedDate + 'T12:00:00');
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const todayStr = toDateStr(new Date());

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startDow = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days: Array<{ date: string; day: number; inMonth: boolean }> = [];

    // Previous month padding
    const prevDays = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevDays - i;
      const dt = new Date(viewYear, viewMonth - 1, d);
      days.push({ date: toDateStr(dt), day: d, inMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(viewYear, viewMonth, d);
      days.push({ date: toDateStr(dt), day: d, inMonth: true });
    }

    // Next month padding (fill to 6 rows)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const dt = new Date(viewYear, viewMonth + 1, d);
      days.push({ date: toDateStr(dt), day: d, inMonth: false });
    }

    return days;
  }, [viewMonth, viewYear]);

  const goToPrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelect = (dateStr: string) => {
    onSelectDate(dateStr);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Calendar dropdown */}
      <div
        className="absolute left-4 right-4 top-full mt-2 z-50 glass-elevated p-4 animate-scale-in"
        id="date-picker"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Month/Year header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 active:bg-white/5"
            aria-label="Mês anterior"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="text-sm font-semibold">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            onClick={goToNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 active:bg-white/5"
            aria-label="Próximo mês"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="text-center text-[11px] text-zinc-600 font-medium">
              {wd}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {calendarDays.map(({ date, day, inMonth }) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, todayStr);
            const hasEntry = daysWithEntries.has(date);

            return (
              <button
                key={date}
                onClick={() => handleSelect(date)}
                className="relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-all active:scale-90"
                style={{
                  background: isSelected
                    ? 'var(--accent-green)'
                    : 'transparent',
                  color: isSelected
                    ? '#000'
                    : !inMonth
                    ? 'var(--text-muted)'
                    : isToday
                    ? 'var(--accent-green)'
                    : 'var(--text-primary)',
                }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ fontWeight: isToday || isSelected ? 600 : 400 }}
                >
                  {day}
                </span>
                {/* Entry dot */}
                {hasEntry && !isSelected && (
                  <span
                    className="absolute bottom-0.5 w-1 h-1 rounded-full"
                    style={{ background: 'var(--accent-orange)' }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="flex justify-center gap-3 mt-3 pt-3 border-t border-white/5">
          <button
            onClick={() => handleSelect(todayStr)}
            className="pill text-xs py-1.5 px-3"
            style={{
              background: isSameDay(selectedDate, todayStr) ? 'var(--accent-green)' : undefined,
              color: isSameDay(selectedDate, todayStr) ? '#000' : undefined,
            }}
          >
            Hoje
          </button>
          <button
            onClick={() => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              handleSelect(toDateStr(yesterday));
            }}
            className="pill text-xs py-1.5 px-3"
          >
            Ontem
          </button>
        </div>
      </div>
    </>
  );
}
