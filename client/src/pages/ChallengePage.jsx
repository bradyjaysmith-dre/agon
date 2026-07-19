import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { button, buttonSecondary, colors, input, label, page, panel } from '../theme.js';

export default function ChallengePage() {
  const { challengeId } = useParams();
  const api = useApi();
  const [challenge, setChallenge] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [error, setError] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [challengeData, leaderboardData] = await Promise.all([
        api(`/api/challenges/${challengeId}`),
        api(`/api/progress/challenges/${challengeId}/leaderboard`),
      ]);
      setChallenge(challengeData);
      setLeaderboard(leaderboardData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId]);

  async function runAction(fn) {
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const isParticipant = challenge?.participants.some((p) => p.id === challenge.currentUserId);

  async function handleJoin() {
    runAction(() => api(`/api/challenges/${challengeId}/join`, { method: 'POST' }));
  }

  async function handleLogProgress(e) {
    e.preventDefault();
    runAction(async () => {
      await api(`/api/challenges/${challengeId}/progress`, {
        method: 'POST',
        body: JSON.stringify({ value: value ? Number(value) : null, description }),
      });
      setValue('');
      setDescription('');
    });
  }

  async function handleConfirm(entryId) {
    runAction(() => api(`/api/progress/${entryId}/confirm`, { method: 'POST' }));
  }

  async function handleComplete() {
    runAction(() => api(`/api/challenges/${challengeId}/complete`, { method: 'POST' }));
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
        {challenge.confirmation_timing === 'per_entry' ? 'confirmed per entry' : 'confirmed at completion'}
      </p>
      {error && <p style={{ color: colors.danger }}>{error}</p>}

      {!isParticipant && challenge.status === 'active' && (
        <button style={button} onClick={handleJoin} disabled={busy}>
          Join Challenge
        </button>
      )}

      <div style={panel}>
        <h3 style={{ marginTop: 0 }}>Leaderboard</h3>
        {leaderboard?.map((row, i) => (
          <div key={row.user_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>
              {i + 1}. {row.name}
            </span>
            <span style={{ color: colors.muted }}>
              {row.confirmed_value} pts · {row.confirmed_entries} confirmed
            </span>
          </div>
        ))}
      </div>

      {isParticipant && challenge.status === 'active' && (
        <form onSubmit={handleLogProgress} style={panel}>
          <h3 style={{ marginTop: 0 }}>Log Progress</h3>
          <label style={label}>Value (optional, e.g. reps / dollars / days)</label>
          <input style={input} value={value} onChange={(e) => setValue(e.target.value)} type="number" />
          <label style={label}>Description</label>
          <input style={input} value={description} onChange={(e) => setDescription(e.target.value)} />
          <button type="submit" style={{ ...button, marginTop: '12px' }} disabled={busy}>
            Submit
          </button>
        </form>
      )}

      <div style={panel}>
        <h3 style={{ marginTop: 0 }}>Progress Entries</h3>
        {challenge.entries.length === 0 && <p style={{ color: colors.muted }}>No entries yet.</p>}
        {challenge.entries.map((entry) => (
          <div key={entry.id} style={{ borderBottom: `1px solid ${colors.border}`, padding: '8px 0' }}>
            <div>
              <strong>{entry.user_name}</strong> {entry.value != null && `— ${entry.value}`}
            </div>
            {entry.description && <div style={{ color: colors.muted, fontSize: '13px' }}>{entry.description}</div>}
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              {entry.confirmed_by ? (
                <span style={{ color: colors.success }}>Confirmed by {entry.confirmed_by_name}</span>
              ) : challenge.isConfirmer ? (
                <button style={buttonSecondary} onClick={() => handleConfirm(entry.id)} disabled={busy}>
                  Confirm
                </button>
              ) : (
                <span style={{ color: colors.muted }}>Awaiting confirmation</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {challenge.isConfirmer && challenge.status === 'active' && (
        <button style={buttonSecondary} onClick={handleComplete} disabled={busy}>
          Mark Challenge Complete
        </button>
      )}
    </div>
  );
}
