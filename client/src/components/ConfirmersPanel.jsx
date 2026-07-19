import { useState } from 'react';
import { useApi } from '../lib/api.js';
import { button, colors, input, panel } from '../theme.js';

export default function ConfirmersPanel({ challenge, onReload }) {
  const api = useApi();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isOriginator = challenge.originator_id === challenge.currentUserId;
  const confirmerIds = new Set(challenge.confirmers.map((c) => c.id));
  const available = challenge.circleMembers.filter((m) => !confirmerIds.has(m.id));

  async function handleAdd(e) {
    e.preventDefault();
    if (!selectedUserId) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/challenges/${challenge.id}/confirmers`, {
        method: 'POST',
        body: JSON.stringify({ userId: Number(selectedUserId) }),
      });
      setSelectedUserId('');
      await onReload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={panel}>
      <h3 style={{ marginTop: 0 }}>Confirmers</h3>
      {error && <p style={{ color: colors.danger }}>{error}</p>}
      {challenge.confirmers.map((c) => (
        <div key={c.id} style={{ fontSize: '14px', color: colors.text }}>
          {c.name}
        </div>
      ))}

      {isOriginator && challenge.status === 'active' && (
        <>
          {available.length > 0 ? (
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <select className={input} value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                <option value="">Add a confirmer…</option>
                {available.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <button type="submit" className={button} disabled={busy || !selectedUserId}>
                Add
              </button>
            </form>
          ) : (
            <p style={{ color: colors.muted, fontSize: '13px', marginTop: '12px' }}>
              Every Circle member is already a confirmer.
            </p>
          )}
        </>
      )}
    </div>
  );
}
