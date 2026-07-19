import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Divider from '../components/Divider.jsx';
import { useApi } from '../lib/api.js';
import { button, colors, input, label, page, panel } from '../theme.js';

export default function DashboardPage() {
  const api = useApi();
  const [circles, setCircles] = useState(null);
  const [error, setError] = useState('');
  const [newCircleName, setNewCircleName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadCircles() {
    try {
      setCircles(await api('/api/circles/mine'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadCircles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newCircleName.trim()) return;
    setBusy(true);
    setError('');
    try {
      await api('/api/circles', { method: 'POST', body: JSON.stringify({ name: newCircleName }) });
      setNewCircleName('');
      await loadCircles();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setBusy(true);
    setError('');
    try {
      await api('/api/circles/join', { method: 'POST', body: JSON.stringify({ inviteCode: joinCode }) });
      setJoinCode('');
      await loadCircles();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={page}>
      <h1>Your Circles</h1>
      <Divider />
      {error && <p style={{ color: colors.danger }}>{error}</p>}

      {circles === null ? (
        <p style={{ color: colors.muted }}>Loading…</p>
      ) : circles.length === 0 ? (
        <p style={{ color: colors.muted }}>You're not in any Circles yet.</p>
      ) : (
        circles.map((circle) => (
          <Link key={circle.id} to={`/circles/${circle.id}`}>
            <div className={panel} style={{ cursor: 'pointer' }}>
              <strong>{circle.name}</strong>
              <div style={{ color: colors.muted, fontSize: '13px' }}>
                Invite code: {circle.invite_code} · {circle.role}
              </div>
            </div>
          </Link>
        ))
      )}

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '24px' }}>
        <form onSubmit={handleCreate} className={panel} style={{ flex: 1, minWidth: '260px' }}>
          <h3 style={{ marginTop: 0 }}>Create a Circle</h3>
          <label className={label}>Name</label>
          <input
            className={input}
            value={newCircleName}
            onChange={(e) => setNewCircleName(e.target.value)}
            placeholder="Smith Family"
          />
          <button type="submit" className={button} style={{ marginTop: '12px' }} disabled={busy}>
            Create
          </button>
        </form>

        <form onSubmit={handleJoin} className={panel} style={{ flex: 1, minWidth: '260px' }}>
          <h3 style={{ marginTop: 0 }}>Join a Circle</h3>
          <label className={label}>Invite code</label>
          <input
            className={input}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="AB12CD"
          />
          <button type="submit" className={button} style={{ marginTop: '12px' }} disabled={busy}>
            Join
          </button>
        </form>
      </div>
    </div>
  );
}
