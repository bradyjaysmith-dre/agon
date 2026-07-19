import { useState } from 'react';
import { useApi } from '../lib/api.js';
import Laurel from './Laurel.jsx';
import { buttonSecondary, colors, panel } from '../theme.js';

export default function TournamentBracketView({ challenge, bracket, onReload }) {
  const api = useApi();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isOriginator = challenge.originator_id === challenge.currentUserId;
  const started = bracket && bracket.length > 0;

  async function runAction(fn) {
    setBusy(true);
    setError('');
    try {
      await fn();
      await onReload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleStart() {
    runAction(() => api(`/api/tournaments/challenges/${challenge.id}/start`, { method: 'POST' }));
  }

  async function handleRecord(matchId, winnerId) {
    runAction(() =>
      api(`/api/tournaments/matches/${matchId}/result`, {
        method: 'POST',
        body: JSON.stringify({ winnerId }),
      })
    );
  }

  if (!started) {
    const count = challenge.participants.length;
    return (
      <div className={panel}>
        <h3 style={{ marginTop: 0 }}>Tournament Bracket</h3>
        {error && <p style={{ color: colors.danger }}>{error}</p>}
        <p style={{ color: colors.muted }}>
          {count} participant{count === 1 ? '' : 's'} joined.
        </p>
        {isOriginator && challenge.status === 'active' && (
          <>
            <button className={buttonSecondary} onClick={handleStart} disabled={busy || count < 2}>
              Start Tournament
            </button>
            {count < 2 && (
              <p style={{ color: colors.muted, fontSize: '13px' }}>Need at least 2 participants to start.</p>
            )}
          </>
        )}
      </div>
    );
  }

  const rounds = {};
  for (const match of bracket) {
    if (!rounds[match.round]) rounds[match.round] = [];
    rounds[match.round].push(match);
  }
  const roundNumbers = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);
  const totalRounds = roundNumbers[roundNumbers.length - 1];
  const finalMatch = bracket.find((m) => m.round === totalRounds);
  const champion = finalMatch?.status === 'completed' ? finalMatch.winner_name : null;

  function matchLabel(match, slot) {
    const name = slot === 1 ? match.participant1_name : match.participant2_name;
    const id = slot === 1 ? match.participant1_id : match.participant2_id;
    if (!id) return match.status === 'completed' ? 'BYE' : 'TBD';
    return name;
  }

  function roundName(round) {
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semifinal';
    return `Round ${round}`;
  }

  return (
    <div className={panel}>
      <h3 style={{ marginTop: 0 }}>Tournament Bracket</h3>
      {error && <p style={{ color: colors.danger }}>{error}</p>}
      {champion && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 20px' }}>
          <Laurel size={220} color="var(--bronze)">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px' }}>🏆</div>
              <strong style={{ color: colors.text }}>{champion}</strong>
            </div>
          </Laurel>
        </div>
      )}

      {roundNumbers.map((round) => (
        <div key={round} style={{ marginBottom: '16px' }}>
          <h4 style={{ marginBottom: '8px' }}>{roundName(round)}</h4>
          {rounds[round]
            .sort((a, b) => a.match_index - b.match_index)
            .map((match) => (
              <div
                key={match.id}
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  padding: '8px 12px',
                  marginBottom: '8px',
                }}
              >
                {[1, 2].map((slot) => {
                  const id = slot === 1 ? match.participant1_id : match.participant2_id;
                  return (
                    <div
                      key={slot}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: slot === 2 ? '4px' : 0,
                      }}
                    >
                      <span style={{ fontWeight: match.winner_id === id ? 700 : 400 }}>{matchLabel(match, slot)}</span>
                      {match.status === 'ready' && challenge.isConfirmer && (
                        <button
                          className={buttonSecondary}
                          style={{ padding: '2px 8px', fontSize: '12px' }}
                          onClick={() => handleRecord(match.id, id)}
                          disabled={busy}
                        >
                          Record win
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
