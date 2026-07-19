import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { buttonSecondary, colors, panel } from '../theme.js';

export default function ManageChallengePanel({ challenge, onReload }) {
  const api = useApi();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isOriginator = challenge.originator_id === challenge.currentUserId;
  if (!isOriginator) return null;

  async function runAction(fn, confirmMessage) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
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

  async function handleDelete() {
    if (!window.confirm('Permanently delete this challenge? This cannot be undone.')) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/challenges/${challenge.id}`, { method: 'DELETE' });
      navigate(`/circles/${challenge.circle_id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className={panel}>
      <h3 style={{ marginTop: 0 }}>Manage Challenge</h3>
      {error && <p style={{ color: colors.danger }}>{error}</p>}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {challenge.status === 'active' && (
          <button
            className={buttonSecondary}
            disabled={busy}
            onClick={() => runAction(() => api(`/api/challenges/${challenge.id}/pause`, { method: 'POST' }))}
          >
            Pause
          </button>
        )}
        {challenge.status === 'paused' && (
          <button
            className={buttonSecondary}
            disabled={busy}
            onClick={() => runAction(() => api(`/api/challenges/${challenge.id}/resume`, { method: 'POST' }))}
          >
            Resume
          </button>
        )}
        {(challenge.status === 'active' || challenge.status === 'paused') && (
          <button
            className={buttonSecondary}
            disabled={busy}
            onClick={() =>
              runAction(
                () => api(`/api/challenges/${challenge.id}/cancel`, { method: 'POST' }),
                'Cancel this challenge?'
              )
            }
          >
            Cancel
          </button>
        )}
        <button
          className={buttonSecondary}
          disabled={busy}
          onClick={() =>
            runAction(
              () => api(`/api/challenges/${challenge.id}/restart`, { method: 'POST' }),
              'Restart from the beginning? This clears all logged progress or match results (and any badges ' +
                'earned in this challenge). Participants and confirmers stay.'
            )
          }
        >
          Restart
        </button>
        <button className={`${buttonSecondary} btn-danger`} disabled={busy} onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}
