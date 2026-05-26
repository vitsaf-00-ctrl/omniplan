import { useState } from 'react';
import { addDays } from 'date-fns';
import { TimelineView } from './CalendarView';

const TODAY = new Date();

export function TimelineScreen() {
  const [day, setDay] = useState(TODAY);
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <TimelineView
        day={day}
        onPrev={() => setDay(d => addDays(d, -1))}
        onNext={() => setDay(d => addDays(d, 1))}
      />
    </div>
  );
}
