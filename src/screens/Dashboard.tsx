import { useAppStore } from '../store/useAppStore';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { MobileTabBar } from '../components/MobileTabBar';
import { ProjectBoard } from './ProjectBoard';
import { CalendarView } from './CalendarView';
import { MyTasks } from './MyTasks';
import { Settings } from './Settings';
import { Today } from './Today';
import { Statistics } from './Statistics';
import { FocusMode } from './FocusMode';
import { TimelineScreen } from './TimelineScreen';
import { TaskModal } from '../components/TaskModal';
import { SearchOverlay } from '../components/SearchOverlay';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useReminderNotifications } from '../hooks/useReminderNotifications';

export function Dashboard() {
  const { activeView } = useAppStore();
  useKeyboardShortcuts();
  useReminderNotifications();

  // Focus mode is fully standalone — no sidebar, header or layout
  if (activeView === 'focus') return <FocusMode/>;

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden">
      <Sidebar/>
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Header/>
        <div className="flex-1 p-3 md:p-5 overflow-hidden relative pb-16 lg:pb-0">
          {activeView === 'today'    && <Today/>}
          {activeView === 'calendar' && <CalendarView/>}
          {activeView === 'timeline' && <TimelineScreen/>}
          {activeView === 'board'    && <ProjectBoard/>}
          {activeView === 'tasks'    && <MyTasks/>}
          {activeView === 'settings' && <Settings/>}
          {activeView === 'stats'    && <Statistics/>}
        </div>
      </main>
      <TaskModal/>
      <SearchOverlay/>
      <MobileTabBar/>
    </div>
  );
}
