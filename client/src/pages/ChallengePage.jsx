import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ConfirmersPanel from '../components/ConfirmersPanel.jsx';
import SimpleProgressView from '../components/SimpleProgressView.jsx';
import TournamentBracketView from '../components/TournamentBracketView.jsx';
import { useApi } from '../lib/api.js';
import { button, colors, page } from '../theme.js';

export default function ChallengePage() {
  const { challengeId } = useParams();
  const api = useApi();
  const [challenge, setChallenge] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [bracket, setBracket] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const challengeData = await api(`/api/challenges/${challengeId}`);
      setChallenge(challengeData);
      if (challengeData.challenge_type === 'tournament_bracket') {
        setBracket(await api(`/api/tournaments/challenges/${challengeId}/bracket`));
      } else {
        setLeaderboard(await api(`/api/progress/challenges/${challengeId}/leaderboard`));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId]);

  const isParticipant = challenge?.participants.some((p) => p.id === challenge.currentUserId);
  const tournamentStarted = challenge?.challenge_type === 'tournament_bracket' && bracket && bracket.length > 0;

  async function handleJoin() {
    setBusy(true);
    setError('');
    try {
      await api(`/api/challenges/${challengeId}/join`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!challenge) {
    return (
      <div style={page}>
        {error ? <p style={{ color: colors.danger }}>{error}</p> : <p style={{ color: colors.muted }}>Loading…</p>}
      </div>
    );
  }

  return (
    <div style={page}>
      <Link to={`/circles/${challenge.circle_id}`} style={{ color: colors.muted, fontSize: '13px' }}>
        ← Circle
      </Link>
      <h1>{challenge.title}</h1>
      <p style={{ color: colors.muted }}>{challenge.description}</p>
      <p style={{ color: colors.muted, fontSize: '13px' }}>
        Status: {challenge.status} ·{' '}
        {challenge.challenge_type === 'tournament_bracket'
          ? 'tournament bracket'
          : challenge.confirmation_timing === 'per_entry'
            ? 'confirmed per entry'
            : 'confirmed at completion'}
      </p>
      {error && <p style={{ color: colors.danger }}>{error}</p>}

      {!isParticipant && challenge.status === 'active' && !tournamentStarted && (
        <button style={button} onClick={handleJoin} disabled={busy}>
          Join Challenge
        </button>
      )}

      <ConfirmersPanel challenge={challenge} onReload={load} />

      {challenge.challenge_type === 'tournament_bracket' ? (
        <TournamentBracketView challenge={challenge} bracket={bracket} onReload={load} />
      ) : (
        <SimpleProgressView
          challenge={challenge}
          leaderboard={leaderboard}
          isParticipant={isParticipant}
          onReload={load}
        />
      )}
    </div>
  );
}
