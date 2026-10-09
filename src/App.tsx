import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DayPage } from './pages/DayPage';
import { ExercisePickerPage } from './pages/ExercisePickerPage';
import { HomePage } from './pages/HomePage';
import { RecordsPage } from './pages/RecordsPage';
import { SetInputPage } from './pages/SetInputPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';
import { Big3Page } from './pages/Big3Page';
import { Big3TiersPage } from './pages/Big3TiersPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { ReportPage } from './pages/ReportPage';
import { AchievementToast } from './components/AchievementToast';
import { Loading, RotateNotice, StatusBarFill } from './components/Layout';

// グラフライブラリが大きいので詳細画面は開いたときに読み込む
const ExerciseDetailPage = lazy(() => import('./pages/ExerciseDetailPage').then((m) => ({ default: m.ExerciseDetailPage })));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    // ホーム画面追加・静的ホスティングでも404にならないようハッシュルーティング
    <HashRouter>
      <ScrollToTop />
      <StatusBarFill />
      <RotateNotice />
      <AchievementToast />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/day/:date" element={<DayPage />} />
        <Route path="/day/:date/pick" element={<ExercisePickerPage />} />
        <Route path="/day/:date/ex/:exerciseId" element={<SetInputPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route
          path="/exercise/:id"
          element={
            <Suspense fallback={<Loading />}>
              <ExerciseDetailPage />
            </Suspense>
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/big3" element={<Big3Page />} />
        <Route path="/big3/tiers" element={<Big3TiersPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/report/:month" element={<ReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
