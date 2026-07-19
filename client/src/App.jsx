import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Link, Route, Routes } from 'react-router-dom';
import BadgesPage from './pages/BadgesPage.jsx';
import ChallengePage from './pages/ChallengePage.jsx';
import CirclePage from './pages/CirclePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import IntroPage from './pages/IntroPage.jsx';

export default function App() {
  return (
    <>
      <SignedOut>
        <IntroPage />
      </SignedOut>

      <SignedIn>
        <div style={{ minHeight: '100vh' }}>
          <header className="app-header">
            <Link to="/" className="brand">
              A<span>·</span>GON
            </Link>
            <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <Link to="/badges" className="nav-link">
                Badges
              </Link>
              <UserButton afterSignOutUrl="/" />
            </nav>
          </header>

          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/circles/:circleId" element={<CirclePage />} />
            <Route path="/challenges/:challengeId" element={<ChallengePage />} />
            <Route path="/badges" element={<BadgesPage />} />
          </Routes>
        </div>
      </SignedIn>
    </>
  );
}
