import { useState } from 'react';
import { useApi } from '../lib/api.js';
import { buttonSecondary, colors, panel } from '../theme.js';

export default function ParticipantsPanel({ challenge, onReload }) {
  const api = useApi();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isOriginator = challenge.originator_id === challenge.currentUserId;

  async function handleKick(userId) {
    if (!window.confirm('Remove this participant from the challenge?')) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/challenges/${challenge.id}/participants/${userId}/kick`, { method: 'POST' });
      await onReload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={panel}>
      <h3 style={{ marginTop: 0 }}>Participants</h3>
      {error && <p style={{ color: colors.danger }}>{error}</p>}
      {challenge.participants.map((p) => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <span style={{ color: p.status === 'active' ? colors.text : colors.muted }}>
            {p.name}
            {p.status !== 'active' && ` (${p.status})`}
          </span>
          {isOriginator && p.status === 'active' && p.id !== challenge.currentUserId && (
            <button
              style={{ ...buttonSecondary, padding: '2px 8px', fontSize: '12px' }}
              onClick={() => handleKick(p.id)}
              disabled={busy}
            >
              Kick
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
