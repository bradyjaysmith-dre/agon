import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Link, Route, Routes } from 'react-router-dom';
import BadgesPage from './pages/BadgesPage.jsx';
import ChallengePage from './pages/ChallengePage.jsx';
import CirclePage from './pages/CirclePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import IntroPage from './pages/IntroPage.jsx';
import { colors, link } from './theme.js';

export default function App() {
  return (
    <>
      <SignedOut>
        <IntroPage />
      </SignedOut>

      <SignedIn>
        <div style={{ minHeight: '100vh', background: colors.bg }}>
          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <Link to="/" style={{ ...link, fontSize: '20px', fontWeight: 700, color: colors.text }}>
              Agon
            </Link>
            <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Link to="/badges" style={link}>
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
