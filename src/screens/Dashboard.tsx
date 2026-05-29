import { lazy, Suspense } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { MobileTabBar } from '../components/MobileTabBar';
import { TaskModal } from '../components/TaskModal';
import { SearchOverlay } from '../components/SearchOverlay';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useReminderNotifications } from '../hooks/useReminderNotifications';

const Today         = lazy(() => import('./Today').then(m => ({ default: m.Today })));
const CalendarView  = lazy(() => import('./CalendarView').then(m => ({ default: m.CalendarView })));
const TimelineScreen = lazy(() => import('./TimelineScreen').then(m => ({ default: m.TimelineScreen })));
const ProjectBoard  = lazy(() => import('./ProjectBoard').then(m => ({ default: m.ProjectBoard })));
const MyTasks       = lazy(() => import('./MyTasks').then(m => ({ default: m.MyTasks })));
const Settings      = lazy(() => import('./Settings').then(m => ({ default: m.Settings })));
const Statistics    = lazy(() => import('./Statistics').then(m => ({ default: m.Statistics })));
const FocusMode     = lazy(() => import('./FocusMode').then(m => ({ default: m.FocusMode })));

function ScreenFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-6 h-6 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"/>
    </div>
  );
}

export function Dashboard() {
  const { activeView } = useAppStore();
  useKeyboardShortcuts();
  useReminderNotifications();

  if (activeView === 'focus') {
    return (
      <Suspense fallback={<ScreenFallback/>}>
        <FocusMode/>
      </Suspense>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden">
      <Sidebar/>
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Header/>
        <div className="flex-1 p-3 md:p-5 overflow-hidden relative pb-16 lg:pb-0">
          <Suspense fallback={<ScreenFallback/>}>
            {activeView === 'today'    && <Today/>}
            {activeView === 'calendar' && <CalendarView/>}
            {activeView === 'timeline' && <TimelineScreen/>}
            {activeView === 'board'    && <ProjectBoard/>}
            {activeView === 'tasks'    && <MyTasks/>}
            {activeView === 'settings' && <Settings/>}
            {activeView === 'stats'    && <Statistics/>}
          </Suspense>
        </div>
      </main>
      <TaskModal/>
      <SearchOverlay/>
      <MobileTabBar/>
    </div>
  );
}
