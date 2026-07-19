import { useState } from 'react';
import { useApi } from '../lib/api.js';
import { button, buttonSecondary, colors, input, label, panel } from '../theme.js';

export default function EditChallengeForm({ challenge, onSaved, onCancel }) {
  const api = useApi();
  const [title, setTitle] = useState(challenge.title);
  const [description, setDescription] = useState(challenge.description ?? '');
  const [confirmationTiming, setConfirmationTiming] = useState(challenge.confirmation_timing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError('');
    try {
      const body = { title, description };
      if (challenge.challenge_type === 'simple_progress') {
        body.confirmationTiming = confirmationTiming;
      }
      await api(`/api/challenges/${challenge.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      await onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSave} className={panel}>
      <h3 style={{ marginTop: 0 }}>Edit Challenge</h3>
      {error && <p style={{ color: colors.danger }}>{error}</p>}

      <label className={label}>Title</label>
      <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} />

      <label className={label}>Description / rules</label>
      <textarea
        className={input}
        style={{ minHeight: '80px' }}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {challenge.challenge_type === 'simple_progress' && (
        <>
          <label className={label}>Confirmation timing</label>
          <select className={input} value={confirmationTiming} onChange={(e) => setConfirmationTiming(e.target.value)}>
            <option value="completion_only">Confirm only at completion</option>
            <option value="per_entry">Confirm every entry</option>
          </select>
        </>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button type="submit" className={button} disabled={busy}>
          Save
        </button>
        <button type="button" className={buttonSecondary} onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
