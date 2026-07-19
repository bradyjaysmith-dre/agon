import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Link, Route, Routes } from 'react-router-dom';
import BadgesPage from './pages/BadgesPage.jsx';
import ChallengePage from './pages/ChallengePage.jsx';
import CirclePage from './pages/CirclePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { colors, link } from './theme.js';

export default function App() {
  return (
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
          <SignedIn>
            <Link to="/badges" style={link}>
              Badges
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal" />
          </SignedOut>
        </nav>
      </header>

      <SignedOut>
        <div style={{ padding: '48px 24px', textAlign: 'center', color: colors.text }}>
          <h1>Agon</h1>
          <p style={{ color: colors.muted }}>
            Post a challenge. Invite your Circle. Track who actually did it.
          </p>
          <SignInButton mode="modal" />
        </div>
      </SignedOut>

      <SignedIn>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/circles/:circleId" element={<CirclePage />} />
          <Route path="/challenges/:challengeId" element={<ChallengePage />} />
          <Route path="/badges" element={<BadgesPage />} />
        </Routes>
      </SignedIn>
    </div>
  );
}
