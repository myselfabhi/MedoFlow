'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { AppButton } from './AppButton';

export type AppCalendarProps = React.ComponentProps<typeof DayPicker>;

function AppCalendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: AppCalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3 bg-white', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center mb-4',
        caption_label: 'text-sm font-bold text-slate-900',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          'h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity flex items-center justify-center rounded-full hover:bg-slate-100'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-slate-400 rounded-md w-10 font-bold text-[10px] uppercase tracking-widest',
        row: 'flex w-full mt-2',
        cell: cn(
          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-primary-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md',
          props.mode === 'range'
            ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
            : '[&:has([aria-selected])]:rounded-md'
        ),
        day: cn(
          'h-10 w-10 p-0 font-bold aria-selected:opacity-100 hover:bg-slate-100 rounded-full transition-all text-slate-700'
        ),
        day_range_start: 'day-range-start',
        day_range_end: 'day-range-end',
        day_selected:
          'bg-primary-600 text-white hover:bg-primary-700 hover:text-white focus:bg-primary-600 focus:text-white',
        day_today: 'bg-slate-100 text-slate-900',
        day_outside: 'text-slate-300 opacity-50',
        day_disabled: 'text-slate-300 opacity-50 cursor-not-allowed',
        day_range_middle:
          'aria-selected:bg-primary-50 aria-selected:text-primary-900',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
AppCalendar.displayName = 'AppCalendar';

export { AppCalendar };
