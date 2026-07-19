import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { button, colors, input, label, page, panel } from '../theme.js';

export default function CirclePage() {
  const { circleId } = useParams();
  const api = useApi();
  const [circle, setCircle] = useState(null);
  const [challenges, setChallenges] = useState(null);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [confirmationTiming, setConfirmationTiming] = useState('completion_only');
  const [challengeType, setChallengeType] = useState('simple_progress');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [circleData, challengeData] = await Promise.all([
        api(`/api/circles/${circleId}`),
        api(`/api/challenges/circles/${circleId}/challenges`),
      ]);
      setCircle(circleData);
      setChallenges(challengeData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circleId]);

  async function handleCreateChallenge(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/challenges/circles/${circleId}/challenges`, {
        method: 'POST',
        body: JSON.stringify({ title, description, confirmationTiming, challengeType }),
      });
      setTitle('');
      setDescription('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!circle) {
    return (
      <div style={page}>
        {error ? <p style={{ color: colors.danger }}>{error}</p> : <p style={{ color: colors.muted }}>Loading…</p>}
      </div>
    );
  }

  return (
    <div style={page}>
      <Link to="/" style={{ color: colors.muted, fontSize: '13px' }}>
        ← Your Circles
      </Link>
      <h1>{circle.name}</h1>
      <p style={{ color: colors.muted }}>
        Invite code: <strong>{circle.invite_code}</strong> — share this so others can join.
      </p>
      {error && <p style={{ color: colors.danger }}>{error}</p>}

      <div style={panel}>
        <h3 style={{ marginTop: 0 }}>Members</h3>
        {circle.members.map((m) => (
          <div key={m.id} style={{ fontSize: '14px', color: colors.text }}>
            {m.name || m.email} <span style={{ color: colors.muted }}>({m.role})</span>
          </div>
        ))}
      </div>

      <h2>Challenges</h2>
      {challenges?.length === 0 && <p style={{ color: colors.muted }}>No challenges yet.</p>}
      {challenges?.map((c) => (
        <Link key={c.id} to={`/challenges/${c.id}`} style={{ textDecoration: 'none' }}>
          <div
            style={{
              ...panel,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <strong>{c.title}</strong>
              <div style={{ color: colors.muted, fontSize: '13px' }}>
                {c.status} ·{' '}
                {c.challenge_type === 'tournament_bracket'
                  ? 'tournament bracket'
                  : c.confirmation_timing === 'per_entry'
                    ? 'confirmed per entry'
                    : 'confirmed at completion'}
              </div>
            </div>
            <span style={{ color: colors.accent, fontSize: '13px', whiteSpace: 'nowrap' }}>
              {c.challenge_type === 'tournament_bracket' ? 'Open bracket →' : 'Open, log progress & leaderboard →'}
            </span>
          </div>
        </Link>
      ))}

      <form onSubmit={handleCreateChallenge} style={panel}>
        <h3 style={{ marginTop: 0 }}>Create a Challenge</h3>
        <label style={label}>Title</label>
        <input style={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="30-day plank streak" />
        <label style={label}>Description / rules</label>
        <textarea
          style={{ ...input, minHeight: '80px' }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label style={label}>Challenge type</label>
        <select style={input} value={challengeType} onChange={(e) => setChallengeType(e.target.value)}>
          <option value="simple_progress">Simple Progress Tracking</option>
          <option value="tournament_bracket">Tournament Bracket</option>
        </select>
        <div style={{ color: colors.muted, fontSize: '12px', marginTop: '4px' }}>
          {challengeType === 'tournament_bracket'
            ? 'Single-elimination bracket — good for head-to-head competitions like chess or ping pong.'
            : 'Participants log progress over time, confirmed by you or a delegate, ranked on a leaderboard.'}
        </div>

        {challengeType === 'simple_progress' && (
          <>
            <label style={label}>Confirmation timing</label>
            <select
              style={input}
              value={confirmationTiming}
              onChange={(e) => setConfirmationTiming(e.target.value)}
            >
              <option value="completion_only">Confirm only at completion</option>
              <option value="per_entry">Confirm every entry</option>
            </select>
          </>
        )}

        <button type="submit" style={{ ...button, marginTop: '12px' }} disabled={busy}>
          Create Challenge
        </button>
      </form>
    </div>
  );
}
