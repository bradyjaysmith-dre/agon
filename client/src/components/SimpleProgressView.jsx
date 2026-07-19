import { useState } from 'react';
import { useApi } from '../lib/api.js';
import Laurel from './Laurel.jsx';
import { button, buttonSecondary, colors, input, label, panel } from '../theme.js';

export default function SimpleProgressView({ challenge, leaderboard, isParticipant, onReload }) {
  const api = useApi();
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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

  async function handleLogProgress(e) {
    e.preventDefault();
    runAction(async () => {
      await api(`/api/progress/challenges/${challenge.id}/progress`, {
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
    runAction(() => api(`/api/challenges/${challenge.id}/complete`, { method: 'POST' }));
  }

  return (
    <>
      {error && <p style={{ color: colors.danger }}>{error}</p>}

      <div className={panel}>
        <h3 style={{ marginTop: 0 }}>Leaderboard</h3>
        {leaderboard?.map((row, i) => (
          <div key={row.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {i === 0 && Number(row.confirmed_entries) > 0 && <Laurel size={28} />}
              {i + 1}. {row.name}
            </span>
            <span style={{ color: colors.muted }}>
              {row.confirmed_value} pts · {row.confirmed_entries} confirmed
            </span>
          </div>
        ))}
      </div>

      {isParticipant && challenge.status === 'active' && (
        <form onSubmit={handleLogProgress} className={panel}>
          <h3 style={{ marginTop: 0 }}>Log Progress</h3>
          <label className={label}>Value (optional, e.g. reps / dollars / days)</label>
          <input className={input} value={value} onChange={(e) => setValue(e.target.value)} type="number" />
          <label className={label}>Description</label>
          <input className={input} value={description} onChange={(e) => setDescription(e.target.value)} />
          <button type="submit" className={button} style={{ marginTop: '12px' }} disabled={busy}>
            Submit
          </button>
        </form>
      )}

      <div className={panel}>
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
                <button className={buttonSecondary} onClick={() => handleConfirm(entry.id)} disabled={busy}>
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
        <button className={buttonSecondary} onClick={handleComplete} disabled={busy}>
          Mark Challenge Complete
        </button>
      )}
    </>
  );
}
